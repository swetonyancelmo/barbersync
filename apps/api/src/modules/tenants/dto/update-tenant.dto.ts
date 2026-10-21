import { IsString, MaxLength } from 'class-validator';

export class UpdateTenantSlugDto {
  /** Formato e palavras reservadas são validados por slugProblem() no service. */
  @IsString()
  @MaxLength(40)
  slug: string;
}
