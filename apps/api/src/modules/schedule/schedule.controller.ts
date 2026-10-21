import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@barbersync/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { resolveTenantId } from '../../common/tenant/tenant-context';
import { TenantsService } from '../tenants/tenants.service';
import { ScheduleService } from './schedule.service';
import {
  CreateFolgaDto,
  UpdateBarberScheduleDto,
  UpdateScheduleDto,
} from './dto/schedule.dto';

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

  // ----- Por barbeiro: leitura p/ a equipe, escrita só do dono ---------------

  @Roles(UserRole.ADMIN, UserRole.BARBEIRO)
  @Get('barbeiros/:id')
  getBarbeiro(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.schedule.getBarbeiro(resolveTenantId(user), id);
  }

  @Roles(UserRole.ADMIN)
  @Put('barbeiros/:id')
  updateBarbeiro(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBarberScheduleDto,
  ) {
    return this.schedule.updateBarbeiro(resolveTenantId(user), id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Post('barbeiros/:id/folgas')
  addFolga(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFolgaDto,
  ) {
    return this.schedule.addFolga(resolveTenantId(user), id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete('barbeiros/:id/folgas/:folgaId')
  @HttpCode(204)
  removeFolga(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('folgaId', ParseUUIDPipe) folgaId: string,
  ) {
    return this.schedule.removeFolga(resolveTenantId(user), id, folgaId);
  }
}
