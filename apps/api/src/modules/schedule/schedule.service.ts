import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, MoreThanOrEqual, Repository } from 'typeorm';
import {
  AppointmentStatus,
  Bloco,
  blocosContidos,
  defaultExpediente,
  ExpedienteBarbeiroDia,
  ExpedienteDia,
  Folga,
  intersectBlocos,
  MotivoFechado,
  WEEKDAYS,
} from '@barbersync/shared';
import { Expediente } from './expediente.entity';
import { ExpedienteBarbeiro } from './expediente-barbeiro.entity';
import { FolgaBarbeiro } from './folga-barbeiro.entity';
import { Agendamento } from '../appointments/agendamento.entity';
import { BarbersService } from '../barbers/barbers.service';
import {
  CreateFolgaDto,
  UpdateBarberScheduleDto,
  UpdateScheduleDto,
} from './dto/schedule.dto';

/** Expediente efetivo de um barbeiro numa data. */
export interface DiaEfetivo {
  aberto: boolean;
  blocos: Bloco[];
  motivo?: MotivoFechado;
}

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Expediente)
    private readonly repo: Repository<Expediente>,
    @InjectRepository(ExpedienteBarbeiro)
    private readonly barbeiroRepo: Repository<ExpedienteBarbeiro>,
    @InjectRepository(FolgaBarbeiro)
    private readonly folgas: Repository<FolgaBarbeiro>,
    @InjectRepository(Agendamento)
    private readonly agendamentos: Repository<Agendamento>,
    private readonly barbers: BarbersService,
  ) {}

  /**
   * Retorna os 7 dias da semana. Se a barbearia ainda não configurou, devolve
   * o expediente padrão (não persiste) para a tela já vir preenchida.
   */
  async getByTenant(tenantId: string): Promise<ExpedienteDia[]> {
    const rows = await this.repo.find({ where: { tenantId } });
    if (rows.length === 0) return defaultExpediente();

    const byDia = new Map(rows.map((r) => [r.diaSemana, r]));
    return defaultExpediente().map((padrao) => {
      const r = byDia.get(padrao.diaSemana);
      return r
        ? { diaSemana: r.diaSemana, aberto: r.aberto, blocos: r.blocos }
        : { diaSemana: padrao.diaSemana, aberto: false, blocos: [] };
    });
  }

  /** Expediente de um dia específico (com fallback para o padrão). */
  async getDia(tenantId: string, diaSemana: number): Promise<ExpedienteDia> {
    const row = await this.repo.findOne({ where: { tenantId, diaSemana } });
    if (row) return { diaSemana: row.diaSemana, aberto: row.aberto, blocos: row.blocos };

    const total = await this.repo.count({ where: { tenantId } });
    if (total > 0) return { diaSemana, aberto: false, blocos: [] };
    return defaultExpediente()[diaSemana];
  }

  /** Substitui a configuração da barbearia (upsert por dia). */
  async update(tenantId: string, dto: UpdateScheduleDto): Promise<ExpedienteDia[]> {
    for (const dia of dto.dias) {
      const existing = await this.repo.findOne({
        where: { tenantId, diaSemana: dia.diaSemana },
      });
      if (existing) {
        existing.aberto = dia.aberto;
        existing.blocos = dia.blocos;
        await this.repo.save(existing);
      } else {
        await this.repo.save(
          this.repo.create({
            tenantId,
            diaSemana: dia.diaSemana,
            aberto: dia.aberto,
            blocos: dia.blocos,
          }),
        );
      }
    }
    return this.getByTenant(tenantId);
  }

  // ----- Disponibilidade por barbeiro ----------------------------------------

  /**
   * Expediente de UM barbeiro numa data — a regra que a grade e a reserva usam:
   *  1. folga na data → fechado;
   *  2. barbearia fechada no dia → fechado;
   *  3. dia personalizado → blocos do barbeiro ∩ blocos da barbearia (se a
   *     barbearia encurtar o horário depois, o barbeiro acompanha);
   *  4. senão → horário da barbearia.
   */
  async getDiaEfetivo(tenantId: string, barbeiroId: string, data: string): Promise<DiaEfetivo> {
    const folga = await this.folgas.exists({ where: { barbeiroId, data } });
    if (folga) return { aberto: false, blocos: [], motivo: 'folga' };

    const diaSemana = new Date(`${data}T00:00:00`).getDay();
    const barbearia = await this.getDia(tenantId, diaSemana);
    if (!barbearia.aberto || barbearia.blocos.length === 0) {
      return { aberto: false, blocos: [], motivo: 'fechado' };
    }

    const proprio = await this.barbeiroRepo.findOne({ where: { barbeiroId, diaSemana } });
    if (!proprio) return { aberto: true, blocos: barbearia.blocos };

    const blocos = proprio.aberto ? intersectBlocos(proprio.blocos, barbearia.blocos) : [];
    return blocos.length > 0
      ? { aberto: true, blocos }
      : { aberto: false, blocos: [], motivo: 'nao-atende' };
  }

  /** Semana do barbeiro (para a tela de Horários do admin) + próximas folgas. */
  async getBarbeiro(tenantId: string, barbeiroId: string) {
    await this.barbers.assertInTenant(barbeiroId, tenantId);
    const [barbearia, proprios, folgas] = await Promise.all([
      this.getByTenant(tenantId),
      this.barbeiroRepo.find({ where: { barbeiroId } }),
      this.folgas.find({
        where: { barbeiroId, data: MoreThanOrEqual(hojeYmd()) },
        order: { data: 'ASC' },
      }),
    ]);
    const porDia = new Map(proprios.map((p) => [p.diaSemana, p]));

    const dias: ExpedienteBarbeiroDia[] = barbearia.map((b) => {
      const p = porDia.get(b.diaSemana);
      const ref = { aberto: b.aberto, blocos: b.blocos };
      return p
        ? { diaSemana: b.diaSemana, personalizado: true, aberto: p.aberto, blocos: p.blocos, barbearia: ref }
        : { diaSemana: b.diaSemana, personalizado: false, aberto: b.aberto, blocos: b.blocos, barbearia: ref };
    });
    return { dias, folgas: folgas.map(toFolga) };
  }

  /**
   * Salva a semana do barbeiro. `personalizado:false` apaga a linha (volta a
   * herdar). Horário personalizado tem que caber no da barbearia. Não mexe em
   * agendamentos já feitos.
   */
  async updateBarbeiro(tenantId: string, barbeiroId: string, dto: UpdateBarberScheduleDto) {
    await this.barbers.assertInTenant(barbeiroId, tenantId);
    const barbearia = await this.getByTenant(tenantId);

    for (const dia of dto.dias) {
      if (!dia.personalizado || !dia.aberto) continue;
      const ref = barbearia[dia.diaSemana];
      if (!ref.aberto) {
        throw new BadRequestException(
          `${WEEKDAYS[dia.diaSemana]}: a barbearia está fechada neste dia.`,
        );
      }
      if (dia.blocos.length === 0 || !blocosContidos(dia.blocos, ref.blocos)) {
        throw new BadRequestException(
          `${WEEKDAYS[dia.diaSemana]}: o horário do barbeiro precisa caber no horário da barbearia.`,
        );
      }
    }

    for (const dia of dto.dias) {
      const existing = await this.barbeiroRepo.findOne({
        where: { barbeiroId, diaSemana: dia.diaSemana },
      });
      if (!dia.personalizado) {
        if (existing) await this.barbeiroRepo.remove(existing);
        continue;
      }
      await this.barbeiroRepo.save(
        Object.assign(existing ?? this.barbeiroRepo.create({ tenantId, barbeiroId, diaSemana: dia.diaSemana }), {
          aberto: dia.aberto,
          blocos: dia.aberto ? dia.blocos : [],
        }),
      );
    }
    return this.getBarbeiro(tenantId, barbeiroId);
  }

  /** Folga de dia inteiro. Recusa data passada e dia com agendamento ativo. */
  async addFolga(tenantId: string, barbeiroId: string, dto: CreateFolgaDto): Promise<Folga> {
    await this.barbers.assertInTenant(barbeiroId, tenantId);
    if (dto.data < hojeYmd()) throw new BadRequestException('Escolha uma data a partir de hoje.');
    if (await this.folgas.exists({ where: { barbeiroId, data: dto.data } })) {
      throw new ConflictException('Já existe uma folga nesta data.');
    }

    const dia = new Date(`${dto.data}T00:00:00`);
    const fim = new Date(dia);
    fim.setHours(23, 59, 59, 999);
    const ativos = await this.agendamentos.count({
      where: {
        tenantId,
        barbeiroId,
        dataHora: Between(dia, fim),
        status: In([AppointmentStatus.PENDENTE, AppointmentStatus.CONFIRMADO]),
      },
    });
    if (ativos > 0) {
      const ddmm = dto.data.slice(8, 10) + '/' + dto.data.slice(5, 7);
      throw new ConflictException(
        `O barbeiro tem ${ativos} agendamento(s) em ${ddmm}. Recuse ou remarque antes de marcar a folga.`,
      );
    }

    const folga = await this.folgas.save(
      this.folgas.create({ tenantId, barbeiroId, data: dto.data, motivo: dto.motivo?.trim() || null }),
    );
    return toFolga(folga);
  }

  async removeFolga(tenantId: string, barbeiroId: string, folgaId: string): Promise<void> {
    const folga = await this.folgas.findOne({ where: { id: folgaId, barbeiroId, tenantId } });
    if (!folga) throw new NotFoundException('Folga não encontrada.');
    await this.folgas.remove(folga);
  }
}

function toFolga(f: FolgaBarbeiro): Folga {
  return { id: f.id, data: f.data, motivo: f.motivo };
}

/** Hoje no fuso do processo (TZ=America/Sao_Paulo em produção), 'YYYY-MM-DD'. */
function hojeYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
