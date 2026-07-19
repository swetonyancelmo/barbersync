import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** Query da tela Clientes do admin: busca por nome/telefone + paginação. */
export class ClientesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
