import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateAppointmentDto {
  /** Barbearia escolhida pelo cliente global. Ignorado para BARBEIRO/ADMIN. */
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsUUID()
  barbeiroId: string;

  /** Multi-select: um ou mais serviços no mesmo agendamento. */
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  servicoIds: string[];

  @IsDateString()
  dataHora: string;
}

export class AvailabilityQueryDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsUUID()
  barbeiroId: string;

  /** Data no formato YYYY-MM-DD. */
  @IsDateString()
  data: string;
}
