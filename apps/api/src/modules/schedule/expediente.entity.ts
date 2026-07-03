import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Bloco } from '@barbersync/shared';

/**
 * Expediente de um dia da semana por barbearia (dias e horários de
 * funcionamento). Substitui o horário antes fixo no código — a grade de
 * disponibilidade do cliente é gerada a partir daqui.
 */
@Entity('expedientes')
@Index(['tenantId', 'diaSemana'], { unique: true })
export class Expediente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  /** 0 = domingo … 6 = sábado. */
  @Column({ name: 'dia_semana', type: 'int' })
  diaSemana: number;

  @Column({ default: true })
  aberto: boolean;

  /** Faixas de atendimento do dia, ex.: [{inicio:'09:00',fim:'12:00'}]. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  blocos: Bloco[];
}
