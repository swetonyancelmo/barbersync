import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentMethod } from '@barbersync/shared';
import { Agendamento } from '../appointments/agendamento.entity';

/**
 * Registro MANUAL de pagamento (sem gateway nesta fase — ver CLAUDE.md §7).
 * O barbeiro marca "Pago" e a forma após o atendimento. tenant_id é redundante
 * com o do agendamento, mas mantido para filtrar direto por barbearia.
 */
@Entity('pagamentos')
@Index(['tenantId'])
export class Pagamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'agendamento_id', type: 'uuid' })
  agendamentoId: string;

  @OneToOne(() => Agendamento)
  @JoinColumn({ name: 'agendamento_id' })
  agendamento: Agendamento;

  @Column({ type: 'enum', enum: PaymentMethod })
  forma: PaymentMethod;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  valor: number;

  @Column({ name: 'pago_em', type: 'timestamptz' })
  pagoEm: Date;
}
