import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { JwtPayload, LoyaltyTier, UserRole } from '@barbersync/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { resolveTenantId } from '../../common/tenant/tenant-context';
import { UsersService } from './users.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ClientesQueryDto } from './dto/clientes-query.dto';

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
    return this.serialize(await this.users.findById(user.sub));
  }

  /** Edita o próprio perfil (nome/telefone). */
  @Patch('me')
  async updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.serialize(await this.users.updateProfile(user.sub, dto));
  }

  private serialize(u: {
    id: string;
    nome: string;
    email: string;
    role: UserRole;
    telefone: string | null;
    tenantId: string | null;
  }) {
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
  async clientes(@CurrentUser() user: JwtPayload, @Query() q: ClientesQueryDto) {
    const tenantId = resolveTenantId(user);
    const { items, total } = await this.users.findClientesByTenant(
      tenantId,
      q.page,
      q.limit,
      q.search,
    );
    // Enriquecimento (fidelidade + última visita) só sobre a página atual.
    const ids = items.map((c) => c.id);
    const [fidelidades, ultimasVisitas] = await Promise.all([
      this.loyalty.mapByClienteIds(tenantId, ids),
      this.appointments.mapUltimaVisita(tenantId, ids),
    ]);

    return {
      items: items.map((c) => {
        const f = fidelidades.get(c.id);
        return {
          id: c.id,
          nome: c.nome,
          telefone: c.telefone,
          ultimaVisita: ultimasVisitas.get(c.id) ?? null,
          totalGasto: Number(f?.totalGastoHistorico ?? 0),
          tier: f?.tier ?? LoyaltyTier.BRONZE,
        };
      }),
      total,
      page: q.page,
      limit: q.limit,
    };
  }
}
