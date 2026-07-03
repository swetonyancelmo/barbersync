import { Controller, Get, Query } from '@nestjs/common';
import { JwtPayload, UserRole } from '@barbersync/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { resolveTenantId } from '../../common/tenant/tenant-context';
import { LoyaltyService } from './loyalty.service';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  /** Progresso de fidelidade do cliente logado numa barbearia (?tenantId). */
  @Roles(UserRole.CLIENTE)
  @Get('me')
  me(@CurrentUser() user: JwtPayload, @Query('tenantId') tenantId: string) {
    const resolved = resolveTenantId(user, tenantId);
    return this.loyalty.getProgress(user.sub, resolved);
  }
}
