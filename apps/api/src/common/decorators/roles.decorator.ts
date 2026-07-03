import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@barbersync/shared';

export const ROLES_KEY = 'roles';

/** Restringe uma rota às roles informadas. Usado junto com o RolesGuard. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
