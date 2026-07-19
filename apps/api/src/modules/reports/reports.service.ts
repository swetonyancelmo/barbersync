import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { And, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import {
  AppointmentStatus,
  LoyaltyTier,
  ReportPeriodo,
  ReportSummary,
} from '@barbersync/shared';
import { Pagamento } from '../payments/pagamento.entity';
import { Agendamento } from '../appointments/agendamento.entity';
import { LoyaltyService } from '../loyalty/loyalty.service';

const TOP_LIMIT = 5;

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Pagamento)
    private readonly pagamentos: Repository<Pagamento>,
    @InjectRepository(Agendamento)
    private readonly agendamentos: Repository<Agendamento>,
    private readonly loyalty: LoyaltyService,
    private readonly config: ConfigService,
  ) {}

  async summary(
    tenantId: string,
    periodo: ReportPeriodo,
    data: string,
  ): Promise<ReportSummary> {
    const { inicio, fim } = resolvePeriodo(periodo, data);
    // O Postgres do docker roda em UTC: sem AT TIME ZONE, um pagamento das 22h
    // cairia no dia seguinte ao agrupar por dia.
    const tz = this.config.get<string>('REPORTS_TIMEZONE', 'America/Sao_Paulo');

    const [serieRaw, atendimentosConcluidos, porBarbeiro, topClientesRaw, topServicos] =
      await Promise.all([
        this.serieRecebido(tenantId, inicio, fim, tz),
        this.countConcluidos(tenantId, inicio, fim),
        this.recebidoPorBarbeiro(tenantId, inicio, fim),
        this.topClientes(tenantId, inicio, fim),
        this.topServicos(tenantId, inicio, fim),
      ]);

    const serie = fillSerie(inicio, fim, serieRaw);
    const recebido = serie.reduce((s, d) => s + d.recebido, 0);
    const pagamentosCount = serie.reduce((s, d) => s + d.atendimentos, 0);

    const tiers = await this.loyalty.mapByClienteIds(
      tenantId,
      topClientesRaw.map((c) => c.clienteId),
    );

    return {
      periodo: { tipo: periodo, inicio: inicio.toISOString(), fim: fim.toISOString() },
      kpis: {
        // "recebido" segue pago_em; "atendimentosConcluidos" segue data_hora —
        // eixos diferentes de propósito (pagamento pode ser registrado noutro dia).
        recebido,
        atendimentosConcluidos,
        ticketMedio: pagamentosCount > 0 ? recebido / pagamentosCount : 0,
      },
      serie,
      porBarbeiro,
      topClientes: topClientesRaw.map((c) => ({
        ...c,
        tier: tiers.get(c.clienteId)?.tier ?? LoyaltyTier.BRONZE,
      })),
      topServicos,
    };
  }

  /** Recebido e nº de pagamentos por dia local (dias sem venda ficam de fora — preenchidos depois). */
  private async serieRecebido(tenantId: string, inicio: Date, fim: Date, tz: string) {
    const rows = await this.pagamentos
      .createQueryBuilder('p')
      .select(`to_char(p.pago_em AT TIME ZONE :tz, 'YYYY-MM-DD')`, 'dia')
      .addSelect('SUM(p.valor)', 'recebido')
      .addSelect('COUNT(*)::int', 'atendimentos')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.pago_em >= :inicio AND p.pago_em < :fim', { inicio, fim })
      .setParameter('tz', tz)
      .groupBy('dia')
      .orderBy('dia', 'ASC')
      .getRawMany<{ dia: string; recebido: string; atendimentos: number }>();
    return rows.map((r) => ({
      dia: r.dia,
      recebido: Number(r.recebido),
      atendimentos: Number(r.atendimentos),
    }));
  }

  private async countConcluidos(tenantId: string, inicio: Date, fim: Date): Promise<number> {
    return this.agendamentos.count({
      where: {
        tenantId,
        status: AppointmentStatus.CONCLUIDO,
        dataHora: MoreThanOrEqualLessThan(inicio, fim),
      },
    });
  }

  private async recebidoPorBarbeiro(tenantId: string, inicio: Date, fim: Date) {
    const rows = await this.pagamentos
      .createQueryBuilder('p')
      .innerJoin('agendamentos', 'a', 'a.id = p.agendamento_id')
      .innerJoin('barbeiros', 'b', 'b.id = a.barbeiro_id')
      .innerJoin('users', 'u', 'u.id = b.user_id')
      .select('b.id', 'barbeiroId')
      .addSelect('u.nome', 'nome')
      .addSelect('COUNT(*)::int', 'atendimentos')
      .addSelect('SUM(p.valor)', 'recebido')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.pago_em >= :inicio AND p.pago_em < :fim', { inicio, fim })
      .groupBy('b.id')
      .addGroupBy('u.nome')
      .orderBy('recebido', 'DESC')
      .getRawMany<{ barbeiroId: string; nome: string; atendimentos: number; recebido: string }>();
    return rows.map((r) => ({
      barbeiroId: r.barbeiroId,
      nome: r.nome,
      atendimentos: Number(r.atendimentos),
      recebido: Number(r.recebido),
    }));
  }

  private async topClientes(tenantId: string, inicio: Date, fim: Date) {
    const rows = await this.agendamentos
      .createQueryBuilder('a')
      .innerJoin('users', 'u', 'u.id = a.cliente_id')
      .leftJoin('pagamentos', 'p', 'p.agendamento_id = a.id')
      .select('u.id', 'clienteId')
      .addSelect('u.nome', 'nome')
      .addSelect('COUNT(a.id)::int', 'atendimentos')
      .addSelect('COALESCE(SUM(p.valor), 0)', 'totalGasto')
      .where('a.tenant_id = :tenantId', { tenantId })
      .andWhere('a.status = :st', { st: AppointmentStatus.CONCLUIDO })
      .andWhere('a.data_hora >= :inicio AND a.data_hora < :fim', { inicio, fim })
      .groupBy('u.id')
      .addGroupBy('u.nome')
      .orderBy('atendimentos', 'DESC')
      .addOrderBy('"totalGasto"', 'DESC')
      .limit(TOP_LIMIT)
      .getRawMany<{ clienteId: string; nome: string; atendimentos: number; totalGasto: string }>();
    return rows.map((r) => ({
      clienteId: r.clienteId,
      nome: r.nome,
      atendimentos: Number(r.atendimentos),
      totalGasto: Number(r.totalGasto),
    }));
  }

  private async topServicos(tenantId: string, inicio: Date, fim: Date) {
    const rows = await this.agendamentos
      .createQueryBuilder('a')
      .innerJoin('agendamento_servicos', 'ags', 'ags.agendamento_id = a.id')
      .innerJoin('servicos', 's', 's.id = ags.servico_id')
      .select('s.id', 'servicoId')
      .addSelect('s.nome', 'nome')
      .addSelect('COUNT(*)::int', 'vezes')
      // Preço ATUAL do catálogo: o snapshot do agendamento é só do total,
      // não por serviço — por isso "receita aproximada".
      .addSelect('SUM(s.preco)', 'receitaAprox')
      .where('a.tenant_id = :tenantId', { tenantId })
      .andWhere('a.status = :st', { st: AppointmentStatus.CONCLUIDO })
      .andWhere('a.data_hora >= :inicio AND a.data_hora < :fim', { inicio, fim })
      .groupBy('s.id')
      .addGroupBy('s.nome')
      .orderBy('vezes', 'DESC')
      .limit(TOP_LIMIT)
      .getRawMany<{ servicoId: string; nome: string; vezes: number; receitaAprox: string }>();
    return rows.map((r) => ({
      servicoId: r.servicoId,
      nome: r.nome,
      vezes: Number(r.vezes),
      receitaAprox: Number(r.receitaAprox),
    }));
  }
}

// ---------------------------------------------------------------------------
// Helpers de período — relógio local do Node, intervalo meio-aberto [inicio, fim)
// (mesmo padrão de datas locais de kpisDoDia/findByDay).
// ---------------------------------------------------------------------------

function resolvePeriodo(periodo: ReportPeriodo, data: string): { inicio: Date; fim: Date } {
  const ancora = new Date(`${data}T00:00:00`);
  const inicio = new Date(ancora);
  const fim = new Date(ancora);

  if (periodo === 'dia') {
    fim.setDate(fim.getDate() + 1);
  } else if (periodo === 'semana') {
    // Semana começa na segunda (dom=0 volta 6 dias).
    const diff = (ancora.getDay() + 6) % 7;
    inicio.setDate(inicio.getDate() - diff);
    fim.setTime(inicio.getTime());
    fim.setDate(fim.getDate() + 7);
  } else {
    inicio.setDate(1);
    fim.setTime(inicio.getTime());
    fim.setMonth(fim.getMonth() + 1);
  }
  return { inicio, fim };
}

/** Completa a série com todos os dias do período (dias sem venda = 0). */
function fillSerie(
  inicio: Date,
  fim: Date,
  rows: { dia: string; recebido: number; atendimentos: number }[],
): { dia: string; recebido: number; atendimentos: number }[] {
  const byDia = new Map(rows.map((r) => [r.dia, r]));
  const serie: { dia: string; recebido: number; atendimentos: number }[] = [];
  for (const d = new Date(inicio); d < fim; d.setDate(d.getDate() + 1)) {
    const key = localDateKey(d);
    serie.push(byDia.get(key) ?? { dia: key, recebido: 0, atendimentos: 0 });
  }
  return serie;
}

function localDateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
}

/** Between meio-aberto [inicio, fim) via FindOperator do TypeORM. */
function MoreThanOrEqualLessThan(inicio: Date, fim: Date) {
  return And(MoreThanOrEqual(inicio), LessThan(fim));
}
