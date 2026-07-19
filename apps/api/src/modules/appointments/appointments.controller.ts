import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AppointmentStatus, JwtPayload, UserRole } from '@barbersync/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { resolveTenantId } from '../../common/tenant/tenant-context';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { TenantsService } from '../tenants/tenants.service';
import { AppointmentsService } from './appointments.service';
import {
  AvailabilityQueryDto,
  CreateAppointmentDto,
} from './dto/appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointments: AppointmentsService,
    private readonly tenants: TenantsService,
  ) {}

  // ---- Cliente -----------------------------------------------------------

  @Roles(UserRole.CLIENTE)
  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAppointmentDto) {
    const tenantId = resolveTenantId(user, dto.tenantId);
    await this.tenants.assertExists(tenantId);
    return this.appointments.createBooking(user.sub, tenantId, dto);
  }

  @Get('availability')
  async availability(
    @CurrentUser() user: JwtPayload,
    @Query() q: AvailabilityQueryDto,
  ) {
    const tenantId = resolveTenantId(user, q.tenantId);
    if (user.role === UserRole.CLIENTE) await this.tenants.assertExists(tenantId);
    return this.appointments.getAvailability(tenantId, q.barbeiroId, q.data);
  }

  @Roles(UserRole.CLIENTE)
  @Get('me')
  mine(@CurrentUser() user: JwtPayload, @Query() q: PaginationQueryDto) {
    return this.appointments.findByCliente(user.sub, q.page, q.limit);
  }

  @Roles(UserRole.CLIENTE)
  @Get('me/proximo')
  proximo(@CurrentUser() user: JwtPayload) {
    return this.appointments.findProximoByCliente(user.sub);
  }

  // ---- Admin: agenda -----------------------------------------------------

  @Roles(UserRole.ADMIN, UserRole.BARBEIRO)
  @Get('day')
  byDay(@CurrentUser() user: JwtPayload, @Query('data') data: string) {
    return this.appointments.findByDay(resolveTenantId(user), data);
  }

  @Roles(UserRole.ADMIN, UserRole.BARBEIRO)
  @Get('pendentes')
  pendentes(@CurrentUser() user: JwtPayload) {
    return this.appointments.findPendentes(resolveTenantId(user));
  }

  @Roles(UserRole.ADMIN, UserRole.BARBEIRO)
  @Get('respondidas')
  respondidas(@CurrentUser() user: JwtPayload) {
    return this.appointments.findRespondidasRecentes(resolveTenantId(user));
  }

  @Roles(UserRole.ADMIN, UserRole.BARBEIRO)
  @Patch(':id/confirmar')
  confirmar(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.appointments.setStatus(id, resolveTenantId(user), AppointmentStatus.CONFIRMADO);
  }

  @Roles(UserRole.ADMIN, UserRole.BARBEIRO)
  @Patch(':id/recusar')
  recusar(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.appointments.setStatus(id, resolveTenantId(user), AppointmentStatus.RECUSADO);
  }

  @Roles(UserRole.ADMIN, UserRole.BARBEIRO)
  @Patch(':id/concluir')
  concluir(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.appointments.setStatus(id, resolveTenantId(user), AppointmentStatus.CONCLUIDO);
  }
}
