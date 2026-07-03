import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBarberDto {
  @IsString()
  @MinLength(2)
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  senha: string;

  @IsOptional()
  @IsString()
  especialidade?: string;

  @IsOptional()
  @IsString()
  telefone?: string;
}
