import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Bloco } from '@barbersync/shared';
import { Barbeiro } from '../barbers/barbeiro.entity';

/**
 * Dia da semana PERSONALIZADO de um barbeiro. Linha existe = o barbeiro tem
 * horário próprio naquele dia; ausente = segue o expediente da barbearia.
 * Os blocos são recortados pelos da barbearia na leitura (getDiaEfetivo).
 */
@Entity('expedientes_barbeiro')
@Index(['barbeiroId', 'diaSemana'], { unique: true })
export class ExpedienteBarbeiro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'barbeiro_id', type: 'uuid' })
  barbeiroId: string;

  @ManyToOne(() => Barbeiro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'barbeiro_id' })
  barbeiro: Barbeiro;

  /** 0 = domingo … 6 = sábado. */
  @Column({ name: 'dia_semana', type: 'int' })
  diaSemana: number;

  @Column({ default: true })
  aberto: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  blocos: Bloco[];
}
