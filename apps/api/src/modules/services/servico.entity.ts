import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('servicos')
@Index(['tenantId'])
export class Servico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column()
  nome: string;

  @Column({ type: 'varchar', nullable: true })
  descricao: string | null;

  @Column({ name: 'duracao_min', type: 'int' })
  duracaoMin: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  preco: number;
}
