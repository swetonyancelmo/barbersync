import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  senha: string;
}

export class RegisterClienteDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  senha: string;

  @IsString()
  @IsNotEmpty()
  telefone: string;
}

export class RegisterBarbeariaDto {
  @IsString()
  @IsNotEmpty()
  nomeBarbearia: string;

  @IsString()
  @IsNotEmpty()
  nomeAdmin: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  senha: string;
}
