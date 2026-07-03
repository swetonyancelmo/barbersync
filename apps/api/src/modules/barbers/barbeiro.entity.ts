import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

/** Perfil estendido de um User com role=BARBEIRO. */
@Entity('barbeiros')
@Index(['tenantId'])
export class Barbeiro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', nullable: true })
  especialidade: string | null;

  @Column({ type: 'numeric', precision: 2, scale: 1, default: 5.0 })
  rating: number;

  @Column({ default: true })
  ativo: boolean;
}
