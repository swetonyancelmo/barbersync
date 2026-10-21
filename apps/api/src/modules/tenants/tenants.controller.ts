import { Body, Controller, Get, Patch } from '@nestjs/common';
import { BarbeariaRef, JwtPayload, UserRole } from '@barbersync/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { resolveTenantId } from '../../common/tenant/tenant-context';
import { TenantsService } from './tenants.service';
import { UpdateTenantSlugDto } from './dto/update-tenant.dto';

const toRef = (t: BarbeariaRef): BarbeariaRef => ({ id: t.id, nome: t.nome, slug: t.slug });

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  /**
   * Barbearias em que o cliente já agendou. Substitui a antiga listagem de
   * TODAS as barbearias — o cliente agora chega pelo link de cada uma
   * (/public/barbearias/:slug), e não vê o catálogo de outros tenants.
   */
  @Roles(UserRole.CLIENTE)
  @Get('minhas')
  minhas(@CurrentUser() user: JwtPayload) {
    return this.tenants.findByCliente(user.sub);
  }

  /** Barbearia do painel (inclui o slug do link de agendamento). */
  @Roles(UserRole.ADMIN, UserRole.BARBEIRO)
  @Get('me')
  async me(@CurrentUser() user: JwtPayload) {
    return toRef(await this.tenants.findById(resolveTenantId(user)));
  }

  /** Só o dono troca o endereço do link — afeta o que já foi divulgado. */
  @Roles(UserRole.ADMIN)
  @Patch('me')
  async update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateTenantSlugDto) {
    return toRef(await this.tenants.updateSlug(resolveTenantId(user), dto.slug));
  }
}
