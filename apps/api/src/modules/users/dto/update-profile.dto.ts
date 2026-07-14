import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Edição do próprio perfil. Email fica de fora por enquanto — mexer no e-mail
 * (que é o login) será tratado junto com a feature de notificações por e-mail.
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @IsOptional()
  @IsString()
  telefone?: string;
}
