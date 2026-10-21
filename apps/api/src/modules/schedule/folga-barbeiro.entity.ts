import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Barbeiro } from '../barbers/barbeiro.entity';

/** Folga de dia inteiro de um barbeiro numa data (férias, consulta, feriado). */
@Entity('folgas_barbeiro')
@Index(['barbeiroId', 'data'], { unique: true })
export class FolgaBarbeiro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'barbeiro_id', type: 'uuid' })
  barbeiroId: string;

  @ManyToOne(() => Barbeiro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'barbeiro_id' })
  barbeiro: Barbeiro;

  /** 'YYYY-MM-DD' — coluna date volta como string no driver pg. */
  @Column({ type: 'date' })
  data: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  motivo: string | null;
}
