import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AppointmentStatus } from '@barbersync/shared';
import { User } from '../users/user.entity';
import { Barbeiro } from '../barbers/barbeiro.entity';
import { Servico } from '../services/servico.entity';

@Entity('agendamentos')
@Index(['tenantId', 'dataHora'])
@Index(['clienteId'])
export class Agendamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'cliente_id', type: 'uuid' })
  clienteId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'cliente_id' })
  cliente: User;

  @Column({ name: 'barbeiro_id', type: 'uuid' })
  barbeiroId: string;

  @ManyToOne(() => Barbeiro, { eager: true })
  @JoinColumn({ name: 'barbeiro_id' })
  barbeiro: Barbeiro;

  /**
   * Multi-select de serviços: um agendamento pode combinar vários serviços.
   * valorTotal/duracaoTotalMin são um SNAPSHOT no momento do agendamento —
   * preços do catálogo podem mudar depois sem alterar o histórico.
   */
  @ManyToMany(() => Servico, { eager: true })
  @JoinTable({
    name: 'agendamento_servicos',
    joinColumn: { name: 'agendamento_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'servico_id', referencedColumnName: 'id' },
  })
  servicos: Servico[];

  @Column({ name: 'data_hora', type: 'timestamptz' })
  dataHora: Date;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.PENDENTE })
  status: AppointmentStatus;

  @Column({ name: 'valor_total', type: 'numeric', precision: 10, scale: 2 })
  valorTotal: number;

  @Column({ name: 'duracao_total_min', type: 'int' })
  duracaoTotalMin: number;

  /** Quando o lembrete "1h antes" foi enviado (null = ainda não; garante envio único). */
  @Column({ name: 'lembrete_enviado_em', type: 'timestamptz', nullable: true })
  lembreteEnviadoEm: Date | null;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
