import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { JwtPayload, UserRole } from '@barbersync/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { resolveTenantId } from '../../common/tenant/tenant-context';
import { TenantsService } from '../tenants/tenants.service';
import { ScheduleService } from './schedule.service';
import { UpdateScheduleDto } from './dto/schedule.dto';

@Controller('schedule')
export class ScheduleController {
  constructor(
    private readonly schedule: ScheduleService,
    private readonly tenants: TenantsService,
  ) {}

  /** Expediente da barbearia. Admin usa o tenant do JWT; cliente passa ?tenantId. */
  @Get()
  async get(@CurrentUser() user: JwtPayload, @Query('tenantId') tenantId?: string) {
    const resolved = resolveTenantId(user, tenantId);
    if (user.role === UserRole.CLIENTE) await this.tenants.assertExists(resolved);
    return this.schedule.getByTenant(resolved);
  }

  @Roles(UserRole.ADMIN, UserRole.BARBEIRO)
  @Put()
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateScheduleDto) {
    return this.schedule.update(resolveTenantId(user), dto);
  }
}
