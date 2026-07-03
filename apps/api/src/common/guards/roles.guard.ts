import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, JwtPayload } from '@barbersync/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';

/** Autoriza a rota apenas se a role do usuário estiver entre as permitidas. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user: JwtPayload = context.switchToHttp().getRequest().user;
    return !!user && required.includes(user.role);
  }
}
