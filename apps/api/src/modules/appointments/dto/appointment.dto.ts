import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  Max,
  Min,
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

  /** Duração somada dos serviços escolhidos (min) — esconde slot que estouraria o bloco. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(480)
  duracao?: number;
}
