import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from '@barbersync/shared';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * tenant_id é NULL para CLIENTE (cliente global, agenda em várias barbearias)
   * e preenchido para BARBEIRO/ADMIN (vinculados a uma barbearia).
   */
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column()
  nome: string;

  @Column()
  email: string;

  @Column({ name: 'senha_hash' })
  senhaHash: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'varchar', nullable: true })
  telefone: string | null;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
