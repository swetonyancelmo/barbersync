import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { JwtPayload, UserRole } from '@barbersync/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { resolveTenantId } from '../../common/tenant/tenant-context';
import { AppointmentsService } from '../appointments/appointments.service';
import { PaymentsService } from './payments.service';
import { RegisterPaymentDto } from './dto/payment.dto';

@Controller('payments')
@Roles(UserRole.ADMIN, UserRole.BARBEIRO)
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly appointments: AppointmentsService,
  ) {}

  @Post()
  register(@CurrentUser() user: JwtPayload, @Body() dto: RegisterPaymentDto) {
    return this.payments.register(resolveTenantId(user), dto.agendamentoId, dto.forma);
  }

  @Get('kpis')
  kpis(@CurrentUser() user: JwtPayload, @Query('data') data: string) {
    return this.payments.kpisDoDia(resolveTenantId(user), data);
  }

  /** Lista de atendimentos do dia com status de pagamento (tela Financeiro). */
  @Get('day')
  async day(@CurrentUser() user: JwtPayload, @Query('data') data: string) {
    const tenantId = resolveTenantId(user);
    const agendamentos = await this.appointments.findByDay(tenantId, data);
    const pagosMap = await this.payments.findByAgendamentoIds(
      agendamentos.map((a) => a.id),
    );
    return agendamentos.map((a) => ({
      agendamento: a,
      pagamento: pagosMap.get(a.id) ?? null,
    }));
  }
}
