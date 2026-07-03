# BarberSync

Plataforma SaaS multi-tenant de agendamento para barbearias. Monorepo com uma
API (NestJS) e dois front-ends (Next.js 14): app do **cliente** (mobile-first) e
**painel** do barbeiro/admin (desktop-first, responsivo).

## Estrutura

```
barbersync/
├── apps/
│   ├── api/        NestJS + TypeORM + PostgreSQL  (porta 3333)
│   ├── client/     Next.js 14 — app do cliente     (porta 3000)
│   └── admin/      Next.js 14 — painel admin        (porta 3001)
├── packages/
│   └── shared/     Enums, tipos e regras de fidelidade compartilhados
└── docker-compose.yml   PostgreSQL de desenvolvimento
```

## Rodando local

Pré-requisitos: Node 20+, Docker (para o Postgres).

```bash
# 1. Banco
docker compose up -d db

# 2. Dependências (workspaces) + build do pacote compartilhado
npm install
npm run build:shared

# 3. Configurar a API
cp apps/api/.env.example apps/api/.env   # DB_SYNC=true já vem ligado p/ dev

# 4. Seed de dados demo (cria barbearia, barbeiros, serviços e um cliente)
npm run seed --workspace @barbersync/api

# 5. Subir os três apps (em terminais separados)
npm run dev:api      # http://localhost:3333/api
npm run dev:client   # http://localhost:3000
npm run dev:admin    # http://localhost:3001
```

Logins do seed: `admin@barbersync.com / 123456` (painel) e
`joao@cliente.com / 123456` (app do cliente).

## Multi-tenancy

Isolamento lógico por `tenant_id` (mesmo domínio para todas as barbearias). Todo
endpoint resolve o tenant no backend a partir do JWT — nunca confia num
`tenant_id` vindo cru do client. Detalhes em [CLAUDE.md](CLAUDE.md) §3 e em
`apps/api/src/common/tenant/tenant-context.ts`.

## Deploy / Infra

Nada de infra de produção provisionada ainda — só o Postgres local via Docker.
Arquitetura-alvo sugerida (a confirmar):

| Componente | Onde | Observação |
|---|---|---|
| API (NestJS) | Container (Fly.io / Railway / Render / ECS) | stateless; escala horizontal |
| Postgres | Serviço gerenciado (Neon, Supabase, RDS) | trocar `DB_SYNC=false` + migrations |
| client + admin | Vercel (dois projetos) ou containers | apontam `NEXT_PUBLIC_API_URL` p/ a API |
| Segredos | Secret manager / env do provedor | `JWT_SECRET`, credenciais do banco |

> ⚠️ `synchronize` (DB_SYNC) só em dev. Antes de produção: gerar migrations
> TypeORM e desligar o sync.
