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

  /**
   * Nunca sai do banco por padrão (select: false) — o User vem eager no
   * Barbeiro e vazaria o hash em toda listagem. Só o login o pede, via
   * UsersService.findByEmailWithPassword.
   */
  @Column({ name: 'senha_hash', select: false })
  senhaHash: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'varchar', nullable: true })
  telefone: string | null;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
