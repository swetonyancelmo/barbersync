import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtPayload, UserRole } from '@barbersync/shared';

/**
 * Resolve o `tenant_id` efetivo de uma requisição — o coração do isolamento
 * multi-tenant. NUNCA confie num tenant_id vindo cru do body/query.
 *
 * Regras (ver CLAUDE.md §3):
 *  - BARBEIRO / ADMIN: o tenant é FIXO no JWT. Qualquer tenant pedido pelo
 *    client é ignorado; se divergir do JWT, é bloqueado (tentativa de acesso
 *    cruzado). O usuário nunca opera fora da própria barbearia.
 *  - CLIENTE: é global (tenantId null no JWT). Ele escolhe em qual barbearia
 *    quer operar, então o tenant precisa vir explícito na rota — mas o service
 *    ainda deve validar que esse tenant existe antes de usar.
 *
 * Retorna o tenantId a ser aplicado em toda query. Para CLIENTE, o chamador
 * deve validar a existência do tenant no banco.
 */
export function resolveTenantId(
  user: JwtPayload,
  requestedTenantId?: string | null,
): string {
  if (user.role === UserRole.BARBEIRO || user.role === UserRole.ADMIN) {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuário sem barbearia vinculada.');
    }
    if (requestedTenantId && requestedTenantId !== user.tenantId) {
      throw new ForbiddenException('Acesso a outra barbearia não permitido.');
    }
    return user.tenantId;
  }

  // CLIENTE (global): precisa informar em qual barbearia está operando.
  if (!requestedTenantId) {
    throw new BadRequestException('tenantId (barbearia) é obrigatório.');
  }
  return requestedTenantId;
}
