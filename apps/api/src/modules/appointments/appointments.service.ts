import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  AppointmentStatus,
  JwtPayload,
  GradeHorarios,
  Paginated,
  SLOT_MINUTES,
  UserRole,
} from '@barbersync/shared';
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
    await this.assertDentroDoExpediente(tenantId, dto.barbeiroId, inicio, duracaoTotalMin);
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
    // Lembrete "1h antes": enviado pelo cron AppointmentReminderService (e-mail).
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
   * Grade Manhã/Tarde de um barbeiro num dia, a partir do expediente EFETIVO
   * dele (folga → horário próprio ∩ barbearia → barbearia). Um slot só fica
   * disponível se o atendimento inteiro (`duracaoMin`) cabe no bloco e não
   * encosta em outro agendamento — o mesmo critério que o createBooking aplica.
   */
  async getAvailability(
    tenantId: string,
    barbeiroId: string,
    data: string,
    duracaoMin: number = SLOT_MINUTES,
  ): Promise<GradeHorarios> {
    const efetivo = await this.schedule.getDiaEfetivo(tenantId, barbeiroId, data);
    if (!efetivo.aberto) return { aberto: false, motivo: efetivo.motivo, manha: [], tarde: [] };

    const dia = new Date(`${data}T00:00:00`);
    const ocupados = await this.intervalosOcupados(tenantId, barbeiroId, dia);
    const agora = Date.now();

    const manha: GradeHorarios['manha'] = [];
    const tarde: GradeHorarios['tarde'] = [];
    for (const bloco of efetivo.blocos) {
      const ini = toMinutes(bloco.inicio);
      const fimBloco = toMinutes(bloco.fim);
      for (let m = ini; m < fimBloco; m += SLOT_MINUTES) {
        const inicio = new Date(dia);
        inicio.setHours(Math.floor(m / 60), m % 60, 0, 0);
        const fim = new Date(inicio.getTime() + duracaoMin * 60_000);
        const disponivel =
          m + duracaoMin <= fimBloco &&
          inicio.getTime() >= agora &&
          !ocupados.some((o) => inicio < o.fim && o.inicio < fim);
        (m < CORTE_MANHA_MIN ? manha : tarde).push({ hora: hhmm(inicio), disponivel });
      }
    }
    return { aberto: true, manha, tarde };
  }

  /**
   * Barra reserva fora do expediente efetivo do barbeiro (folga, dia em que
   * não atende, fora das faixas, atendimento que estoura o bloco ou passado).
   * Sobreposição com outro agendamento fica com o assertSlotFree (409).
   */
  private async assertDentroDoExpediente(
    tenantId: string,
    barbeiroId: string,
    inicio: Date,
    duracaoMin: number,
  ): Promise<void> {
    const efetivo = await this.schedule.getDiaEfetivo(tenantId, barbeiroId, ymd(inicio));
    const m = inicio.getHours() * 60 + inicio.getMinutes();
    const cabe = efetivo.blocos.some(
      (b) => toMinutes(b.inicio) <= m && m + duracaoMin <= toMinutes(b.fim),
    );
    if (!efetivo.aberto || !cabe) {
      throw new BadRequestException('Horário fora do expediente do barbeiro.');
    }
    if (inicio.getTime() < Date.now()) {
      throw new BadRequestException('Esse horário já passou.');
    }
  }

  /** Agendamentos ativos (não recusados) do barbeiro no dia, como intervalos. */
  private async intervalosOcupados(tenantId: string, barbeiroId: string, dia: Date) {
    const doDia = await this.repo.find({
      where: { tenantId, barbeiroId, dataHora: Between(startOfDay(dia), endOfDay(dia)) },
    });
    return doDia
      .filter((a) => a.status !== AppointmentStatus.RECUSADO)
      .map((a) => {
        const i = new Date(a.dataHora);
        return { inicio: i, fim: new Date(i.getTime() + a.duracaoTotalMin * 60_000) };
      });
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

  async findByCliente(
    clienteId: string,
    page: number,
    limit: number,
  ): Promise<Paginated<Agendamento>> {
    const [items, total] = await this.repo.findAndCount({
      where: { clienteId },
      order: { dataHora: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
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

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Data local (fuso do processo — TZ=America/Sao_Paulo em produção) 'YYYY-MM-DD'. */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
