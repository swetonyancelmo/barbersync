import { IsIn, Matches } from 'class-validator';
import { ReportPeriodo } from '@barbersync/shared';

/** Query dos relatórios: período fixo (dia|semana|mes) + data âncora. */
export class ReportQueryDto {
  @IsIn(['dia', 'semana', 'mes'])
  periodo: ReportPeriodo;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'data deve estar no formato YYYY-MM-DD.' })
  data: string;
}
