import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  LOYALTY_RULES,
  pointsFromSpend,
  tierFromSpend,
} from '@barbersync/shared';
import { Fidelidade } from './fidelidade.entity';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(Fidelidade)
    private readonly repo: Repository<Fidelidade>,
  ) {}

  getForCliente(clienteId: string, tenantId: string): Promise<Fidelidade | null> {
    return this.repo.findOne({ where: { clienteId, tenantId } });
  }

  /** Mapa clienteId → Fidelidade (tela Clientes do admin). */
  async mapByClienteIds(
    tenantId: string,
    clienteIds: string[],
  ): Promise<Map<string, Fidelidade>> {
    if (clienteIds.length === 0) return new Map();
    const rows = await this.repo.find({
      where: { tenantId, clienteId: In(clienteIds) },
    });
    return new Map(rows.map((r) => [r.clienteId, r]));
  }

  /**
   * Registra um gasto e recalcula pontos + tier em tempo real.
   * ⚠️ Regra inferida do design (1pt/R$3, tiers por total gasto) — CLAUDE.md §7.
   * Pode mudar; por isso o cálculo vive centralizado em @barbersync/shared.
   */
  async recordSpend(
    clienteId: string,
    tenantId: string,
    valor: number,
  ): Promise<Fidelidade> {
    let fidelidade = await this.repo.findOne({ where: { clienteId, tenantId } });
    if (!fidelidade) {
      fidelidade = this.repo.create({
        clienteId,
        tenantId,
        pontosAtuais: 0,
        totalGastoHistorico: 0,
      });
    }

    const novoTotal = Number(fidelidade.totalGastoHistorico) + Number(valor);
    fidelidade.totalGastoHistorico = novoTotal;
    fidelidade.pontosAtuais = pointsFromSpend(novoTotal);
    fidelidade.tier = tierFromSpend(novoTotal);

    return this.repo.save(fidelidade);
  }

  /** Dados para a barra de progresso de fidelidade no perfil do cliente. */
  async getProgress(clienteId: string, tenantId: string) {
    const f = await this.getForCliente(clienteId, tenantId);
    const pontos = f?.pontosAtuais ?? 0;
    const meta = LOYALTY_RULES.REWARD_THRESHOLD;
    return {
      pontosAtuais: pontos,
      meta,
      faltam: Math.max(0, meta - pontos),
      tier: f?.tier ?? 'BRONZE',
      totalGastoHistorico: Number(f?.totalGastoHistorico ?? 0),
    };
  }
}
