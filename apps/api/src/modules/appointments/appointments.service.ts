import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AppointmentStatus, JwtPayload, SLOT_MINUTES, UserRole } from '@barbersync/shared';
import { Agendamento } from './agendamento.entity';
import { ServicesService } from '../services/services.service';
import { BarbersService } from '../barbers/barbers.service';
import { ScheduleService } from '../schedule/schedule.service';
import { TenantsService } from '../tenants/tenants.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAppointmentDto } from './dto/appointment.dto';

/** Slots de manhã são os que começam antes de 12:00; o resto é tarde. */
const CORTE_MANHA_MIN = 12 * 60;

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Agendamento)
    private readonly repo: Repository<Agendamento>,
    private readonly services: ServicesService,
    private readonly barbers: BarbersService,
    private readonly schedule: ScheduleService,
    private readonly tenants: TenantsService,
    private readonly notifications: NotificationsService,
  ) {}

  // ----- Fluxo do cliente: criar agendamento (entra como PENDENTE) ----------

  async createBooking(
    clienteId: string,
    tenantId: string,
    dto: CreateAppointmentDto,
  ): Promise<Agendamento> {
    const barbeiro = await this.barbers.assertInTenant(dto.barbeiroId, tenantId);
    if (!barbeiro.ativo) {
      throw new BadRequestException('Barbeiro indisponível.');
    }

    const servicos = await this.services.findByIdsInTenant(dto.servicoIds, tenantId);
    const duracaoTotalMin = servicos.reduce((s, x) => s + x.duracaoMin, 0);
    const valorTotal = servicos.reduce((s, x) => s + Number(x.preco), 0);

    const inicio = new Date(dto.dataHora);
    const fim = new Date(inicio.getTime() + duracaoTotalMin * 60_000);
    await this.assertSlotFree(tenantId, dto.barbeiroId, inicio, fim);

    const agendamento = this.repo.create({
      tenantId,
      clienteId,
      barbeiroId: dto.barbeiroId,
      servicos,
      dataHora: inicio,
      duracaoTotalMin,
      valorTotal,
      status: AppointmentStatus.PENDENTE,
    });
    // TODO: agendar lembrete "1h antes" — canal (push/SMS/WhatsApp/e-mail) a definir (CLAUDE.md §7/§11).
    return this.repo.save(agendamento);
  }

  /** Garante que o barbeiro não tem agendamento ativo sobrepondo o intervalo. */
  private async assertSlotFree(
    tenantId: string,
    barbeiroId: string,
    inicio: Date,
    fim: Date,
  ): Promise<void> {
    const doDia = await this.repo.find({
      where: {
        tenantId,
        barbeiroId,
        dataHora: Between(startOfDay(inicio), endOfDay(inicio)),
      },
    });
    const conflito = doDia.some((a) => {
      if (a.status === AppointmentStatus.RECUSADO) return false;
      const aInicio = new Date(a.dataHora);
      const aFim = new Date(aInicio.getTime() + a.duracaoTotalMin * 60_000);
      return inicio < aFim && aInicio < fim; // sobreposição
    });
    if (conflito) {
      throw new ConflictException('Horário indisponível para este barbeiro.');
    }
  }

  /**
   * Grade de horários Manhã/Tarde para um dia, a partir do expediente
   * configurado da barbearia (dias fechados retornam aberto=false).
   */
  async getAvailability(tenantId: string, barbeiroId: string, data: string) {
    const dia = new Date(`${data}T00:00:00`);
    const expediente = await this.schedule.getDia(tenantId, dia.getDay());
    if (!expediente.aberto || expediente.blocos.length === 0) {
      return { aberto: false, manha: [], tarde: [] };
    }

    const ocupados = await this.repo.find({
      where: {
        tenantId,
        barbeiroId,
        dataHora: Between(startOfDay(dia), endOfDay(dia)),
      },
    });
    const intervalosOcupados = ocupados
      .filter((a) => a.status !== AppointmentStatus.RECUSADO)
      .map((a) => {
        const i = new Date(a.dataHora);
        return { inicio: i, fim: new Date(i.getTime() + a.duracaoTotalMin * 60_000) };
      });

    const manha: { hora: string; disponivel: boolean }[] = [];
    const tarde: { hora: string; disponivel: boolean }[] = [];

    for (const bloco of expediente.blocos) {
      const ini = toMinutes(bloco.inicio);
      const fim = toMinutes(bloco.fim);
      for (let m = ini; m < fim; m += SLOT_MINUTES) {
        const slot = new Date(dia);
        slot.setHours(Math.floor(m / 60), m % 60, 0, 0);
        const livre = !intervalosOcupados.some((o) => slot >= o.inicio && slot < o.fim);
        const passado = slot.getTime() < Date.now();
        const item = {
          hora: `${String(slot.getHours()).padStart(2, '0')}:${String(slot.getMinutes()).padStart(2, '0')}`,
          disponivel: livre && !passado,
        };
        (m < CORTE_MANHA_MIN ? manha : tarde).push(item);
      }
    }

    return { aberto: true, manha, tarde };
  }

  // ----- Cliente: histórico e próximo agendamento ---------------------------

  /** Mapa clienteId → data da última visita (agendamento concluído). */
  async mapUltimaVisita(
    tenantId: string,
    clienteIds: string[],
  ): Promise<Map<string, Date>> {
    if (clienteIds.length === 0) return new Map();
    const rows = await this.repo
      .createQueryBuilder('a')
      .select('a.cliente_id', 'clienteId')
      .addSelect('MAX(a.data_hora)', 'ultima')
      .where('a.tenant_id = :tenantId', { tenantId })
      .andWhere('a.cliente_id IN (:...ids)', { ids: clienteIds })
      .andWhere('a.status = :st', { st: AppointmentStatus.CONCLUIDO })
      .groupBy('a.cliente_id')
      .getRawMany<{ clienteId: string; ultima: Date }>();
    return new Map(rows.map((r) => [r.clienteId, r.ultima]));
  }

  findByCliente(clienteId: string): Promise<Agendamento[]> {
    return this.repo.find({
      where: { clienteId },
      order: { dataHora: 'DESC' },
    });
  }

  async findProximoByCliente(clienteId: string): Promise<Agendamento | null> {
    return this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.servicos', 's')
      .leftJoinAndSelect('a.barbeiro', 'b')
      .leftJoinAndSelect('b.user', 'bu')
      .where('a.cliente_id = :clienteId', { clienteId })
      .andWhere('a.data_hora >= :now', { now: new Date() })
      .andWhere('a.status IN (:...st)', {
        st: [AppointmentStatus.PENDENTE, AppointmentStatus.CONFIRMADO],
      })
      .orderBy('a.data_hora', 'ASC')
      .getOne();
  }

  // ----- Admin: agenda do dia, solicitações -------------------------------

  findByDay(tenantId: string, data: string): Promise<Agendamento[]> {
    const dia = new Date(`${data}T00:00:00`);
    return this.repo.find({
      where: { tenantId, dataHora: Between(startOfDay(dia), endOfDay(dia)) },
      order: { dataHora: 'ASC' },
    });
  }

  findPendentes(tenantId: string): Promise<Agendamento[]> {
    return this.repo.find({
      where: { tenantId, status: AppointmentStatus.PENDENTE },
      order: { dataHora: 'ASC' },
    });
  }

  findRespondidasRecentes(tenantId: string): Promise<Agendamento[]> {
    return this.repo.find({
      where: [
        { tenantId, status: AppointmentStatus.CONFIRMADO },
        { tenantId, status: AppointmentStatus.RECUSADO },
      ],
      order: { criadoEm: 'DESC' },
      take: 10,
    });
  }

  async setStatus(
    id: string,
    tenantId: string,
    status: AppointmentStatus,
  ): Promise<Agendamento> {
    const agendamento = await this.repo.findOne({ where: { id, tenantId } });
    if (!agendamento) throw new NotFoundException('Agendamento não encontrado.');

    const era = agendamento.status;
    agendamento.status = status;
    const salvo = await this.repo.save(agendamento);

    // Notifica o cliente ao confirmar — só na transição (idempotente: não
    // reenvia se já estava CONFIRMADO). Fire-and-forget: não bloqueia a resposta.
    if (status === AppointmentStatus.CONFIRMADO && era !== AppointmentStatus.CONFIRMADO) {
      void this.dispatchConfirmacao(salvo, tenantId);
    }
    return salvo;
  }

  private async dispatchConfirmacao(agendamento: Agendamento, tenantId: string): Promise<void> {
    try {
      const tenant = await this.tenants.findById(tenantId);
      await this.notifications.notifyAppointmentConfirmed({
        clienteNome: agendamento.cliente.nome,
        clienteEmail: agendamento.cliente.email,
        clienteTelefone: agendamento.cliente.telefone,
        barbeariaNome: tenant.nome,
        barbeiroNome: agendamento.barbeiro.user.nome,
        servicos: agendamento.servicos.map((s) => s.nome),
        dataHora: agendamento.dataHora,
        valorTotal: Number(agendamento.valorTotal),
      });
    } catch {
      /* NotificationsService já loga; nunca propagar para não afetar a confirmação. */
    }
  }

  async findByIdInTenant(id: string, tenantId: string): Promise<Agendamento> {
    const a = await this.repo.findOne({ where: { id, tenantId } });
    if (!a) throw new NotFoundException('Agendamento não encontrado.');
    return a;
  }

  /** Garante que o solicitante pode ver este agendamento (dono ou mesma barbearia). */
  assertCanAccess(agendamento: Agendamento, user: JwtPayload): void {
    if (user.role === UserRole.CLIENTE) {
      if (agendamento.clienteId !== user.sub) {
        throw new ForbiddenException('Acesso negado.');
      }
    } else if (agendamento.tenantId !== user.tenantId) {
      throw new ForbiddenException('Acesso negado.');
    }
  }
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
