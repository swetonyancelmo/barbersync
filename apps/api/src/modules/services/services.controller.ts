import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@barbersync/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { resolveTenantId } from '../../common/tenant/tenant-context';
import { TenantsService } from '../tenants/tenants.service';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly services: ServicesService,
    private readonly tenants: TenantsService,
  ) {}

  /**
   * Lista serviços de uma barbearia. CLIENTE precisa informar ?tenantId=...
   * (barbearia escolhida); BARBEIRO/ADMIN usam o tenant do próprio JWT.
   */
  @Get()
  async list(@CurrentUser() user: JwtPayload, @Query('tenantId') tenantId?: string) {
    const resolved = resolveTenantId(user, tenantId);
    if (user.role === UserRole.CLIENTE) await this.tenants.assertExists(resolved);
    return this.services.findAllByTenant(resolved);
  }

  @Roles(UserRole.ADMIN, UserRole.BARBEIRO)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateServiceDto) {
    return this.services.create(resolveTenantId(user), dto);
  }

  @Roles(UserRole.ADMIN, UserRole.BARBEIRO)
  @Put(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.services.update(id, resolveTenantId(user), dto);
  }

  @Roles(UserRole.ADMIN, UserRole.BARBEIRO)
  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.services.remove(id, resolveTenantId(user));
  }
}
