import { IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @MinLength(2)
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsInt()
  @Min(1)
  duracaoMin: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco: number;
}

export class UpdateServiceDto extends CreateServiceDto {}
