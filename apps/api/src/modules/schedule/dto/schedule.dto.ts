import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export class BlocoDto {
  @IsString()
  @Matches(HORA, { message: 'inicio deve ser HH:mm' })
  inicio: string;

  @IsString()
  @Matches(HORA, { message: 'fim deve ser HH:mm' })
  fim: string;
}

export class ExpedienteDiaDto {
  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana: number;

  @IsBoolean()
  aberto: boolean;

  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => BlocoDto)
  blocos: BlocoDto[];
}

export class UpdateScheduleDto {
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => ExpedienteDiaDto)
  dias: ExpedienteDiaDto[];
}
