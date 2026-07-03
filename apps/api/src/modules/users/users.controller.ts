import { Controller, Get, Query } from '@nestjs/common';
import { JwtPayload, LoyaltyTier, UserRole } from '@barbersync/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { resolveTenantId } from '../../common/tenant/tenant-context';
import { UsersService } from './users.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { AppointmentsService } from '../appointments/appointments.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly loyalty: LoyaltyService,
    private readonly appointments: AppointmentsService,
  ) {}

  /** Perfil do usuário logado (dados básicos, sem hash). */
  @Get('me')
  async me(@CurrentUser() user: JwtPayload) {
    const u = await this.users.findById(user.sub);
    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      role: u.role,
      telefone: u.telefone,
      tenantId: u.tenantId,
    };
  }

  /**
   * Tela Clientes (admin): nome, telefone, última visita, total gasto, tier.
   * Só clientes com agendamento na barbearia do usuário logado.
   */
  @Roles(UserRole.ADMIN, UserRole.BARBEIRO)
  @Get('clientes')
  async clientes(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
  ) {
    const tenantId = resolveTenantId(user);
    const clientes = await this.users.findClientesByTenant(tenantId, search);
    const ids = clientes.map((c) => c.id);
    const [fidelidades, ultimasVisitas] = await Promise.all([
      this.loyalty.mapByClienteIds(tenantId, ids),
      this.appointments.mapUltimaVisita(tenantId, ids),
    ]);

    return clientes.map((c) => {
      const f = fidelidades.get(c.id);
      return {
        id: c.id,
        nome: c.nome,
        telefone: c.telefone,
        ultimaVisita: ultimasVisitas.get(c.id) ?? null,
        totalGasto: Number(f?.totalGastoHistorico ?? 0),
        tier: f?.tier ?? LoyaltyTier.BRONZE,
      };
    });
  }
}
