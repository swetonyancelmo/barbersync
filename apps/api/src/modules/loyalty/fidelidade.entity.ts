import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LoyaltyTier } from '@barbersync/shared';

/**
 * Fidelidade por (cliente, tenant): como o cliente é global, ele acumula
 * pontos/tier separadamente em cada barbearia onde agenda.
 * Pontos e tier são recalculados em tempo real a cada pagamento registrado.
 * ⚠️ Regras (1pt/R$3, meta 250, faixas de tier) inferidas do design — CLAUDE.md §7.
 */
@Entity('fidelidades')
@Index(['clienteId', 'tenantId'], { unique: true })
export class Fidelidade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_id', type: 'uuid' })
  clienteId: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'pontos_atuais', type: 'int', default: 0 })
  pontosAtuais: number;

  @Column({ name: 'total_gasto_historico', type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalGastoHistorico: number;

  @Column({ type: 'enum', enum: LoyaltyTier, default: LoyaltyTier.BRONZE })
  tier: LoyaltyTier;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
