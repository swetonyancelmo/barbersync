import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  /**
   * Endereço público do link de agendamento (app.barbersync.com/<slug>).
   * Único, validado por slugProblem() de @barbersync/shared.
   */
  @Column({ type: 'varchar', length: 40, unique: true })
  slug: string;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
