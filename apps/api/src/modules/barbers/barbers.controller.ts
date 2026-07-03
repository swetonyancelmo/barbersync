import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@barbersync/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { resolveTenantId } from '../../common/tenant/tenant-context';
import { TenantsService } from '../tenants/tenants.service';
import { BarbersService } from './barbers.service';
import { CreateBarberDto } from './dto/barber.dto';

@Controller('barbers')
export class BarbersController {
  constructor(
    private readonly barbers: BarbersService,
    private readonly tenants: TenantsService,
  ) {}

  /** CLIENTE lista barbeiros ATIVOS da barbearia escolhida (?tenantId). Admin vê todos. */
  @Get()
  async list(@CurrentUser() user: JwtPayload, @Query('tenantId') tenantId?: string) {
    const resolved = resolveTenantId(user, tenantId);
    if (user.role === UserRole.CLIENTE) {
      await this.tenants.assertExists(resolved);
      return this.barbers.findAtivosByTenant(resolved);
    }
    return this.barbers.findAllByTenant(resolved);
  }

  @Roles(UserRole.ADMIN, UserRole.BARBEIRO)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBarberDto) {
    return this.barbers.create(resolveTenantId(user), dto);
  }

  @Roles(UserRole.ADMIN, UserRole.BARBEIRO)
  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.barbers.remove(id, resolveTenantId(user));
  }
}
