---
name: nestjs-module
description: >
  Use ao criar ou editar um módulo do backend do BarberSync (apps/api) —
  nova entity, controller, service, DTO ou endpoint. Garante o padrão do
  projeto: convenções de entity/TypeORM, isolamento multi-tenant via
  resolveTenantId, guards de role, validação de DTO e registro do módulo,
  além das pegadinhas de build (tsconfig sem paths, incremental:false, DB_SYNC).
  Gatilhos: "novo módulo NestJS", "adicionar entity/endpoint", "criar CRUD no backend".
---

# Módulo NestJS no BarberSync

Padrão de um módulo em `apps/api/src/modules/<nome>/`:

```
<nome>/
├── <nome>.entity.ts        # entidade TypeORM
├── <nome>.service.ts       # regra de negócio (toda query filtra por tenant)
├── <nome>.controller.ts    # rotas REST
├── <nome>.module.ts        # @Module (importa TypeOrmModule.forFeature([...]))
└── dto/<nome>.dto.ts        # DTOs com class-validator
```

## Entity — convenções

- PK `uuid`: `@PrimaryGeneratedColumn('uuid')`.
- Colunas em snake_case via `name:` (o código usa camelCase): `@Column({ name: 'tenant_id', type: 'uuid' })`.
- **Toda entidade operacional carrega `tenant_id`** (uuid). Exceção: `User.tenant_id` é **nullable** (NULL para CLIENTE global).
- Timestamps: `@CreateDateColumn({ name: 'criado_em' })`.
- Dinheiro: `numeric(10,2)`; ler com `Number(...)` no service (vem string do pg).
- Índices úteis: `@Index(['tenantId'])`, e `@Index([...], { unique: true })` quando fizer sentido (ex.: `Fidelidade` por cliente+tenant).
- Multi-select usa ManyToMany + `@JoinTable` com snapshot no dono (ver `Agendamento.servicos` + `valorTotal`/`duracaoTotalMin`).
- Entities são carregadas por glob (`config/typeorm.config.ts`) — não precisa listar manualmente. Em dev, `DB_SYNC=true` cria/atualiza as tabelas.

## Multi-tenancy — regra inviolável

Nunca confie em `tenant_id` vindo do body/query. Resolva sempre no backend:

```ts
import { resolveTenantId } from '../../common/tenant/tenant-context';
// controller:
async list(@CurrentUser() user: JwtPayload, @Query('tenantId') tenantId?: string) {
  const resolved = resolveTenantId(user, tenantId); // ADMIN/BARBEIRO: fixo do JWT
  if (user.role === UserRole.CLIENTE) await this.tenants.assertExists(resolved); // CLIENTE: valida
  return this.service.findAllByTenant(resolved);
}
```

- **BARBEIRO/ADMIN**: `resolveTenantId(user)` usa o tenant fixo do JWT (ignora/bloqueia tenant divergente).
- **CLIENTE** (global): passa `?tenantId=`; o controller valida com `TenantsService.assertExists`. Importe `TenantsModule` no módulo.
- Todo método de service recebe `tenantId` e filtra por ele em **toda** query (find/save/delete).

## Roles e auth

- Guards globais `JwtAuthGuard` + `RolesGuard` já aplicados (app.module). Toda rota exige JWT por padrão.
- Restringir: `@Roles(UserRole.ADMIN, UserRole.BARBEIRO)` no handler ou controller.
- Rota sem auth (ex.: login): `@Public()`.
- Usuário atual: `@CurrentUser() user: JwtPayload` (`{ sub, role, tenantId, email }`).

## DTO

- `class-validator` (`@IsUUID`, `@IsEnum`, `@IsNumber({ maxDecimalPlaces: 2 })`, `@ValidateNested` + `@Type`).
- O `ValidationPipe` global tem `whitelist` + `forbidNonWhitelisted` — campos não declarados são rejeitados (defesa extra contra injeção de `tenant_id`).

## Registro e tipos compartilhados

- Importe o módulo em `app.module.ts`. Se outro módulo usa o service, `exports: [XService]` e importe o módulo (evite dependência circular — não importe de volta).
- Enums/tipos/regras que o front também usa vão em `packages/shared/src/index.ts`; rode `npm run build:shared` depois.

## Build (pegadinhas que quebram o backend)

- `apps/api/tsconfig.json`: **não** mapeie `@barbersync/shared` para o source (resolva pelo symlink de node_modules) e mantenha **`incremental: false`**. Reativar qualquer um dos dois faz o `nest build` emitir em `dist/apps/api/...` ou pular a emissão — e some o `dist/main.js`.
- Se `dist/main.js` sumir: `rm -rf apps/api/dist apps/api/tsconfig.tsbuildinfo && npx nest build`.
- Verificar: `cd apps/api && rm -rf dist && npx nest build && ls dist/main.js`.

Depois de criar, valide de ponta a ponta com a skill **barbersync-run-verify**.
