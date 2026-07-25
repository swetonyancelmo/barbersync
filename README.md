# BarberSync

Plataforma SaaS multi-tenant de agendamento para barbearias. Monorepo com uma
API (NestJS) e três front-ends (Next.js 14): app do **cliente** (mobile-first, PWA
instalável), **painel** do barbeiro/admin (desktop-first, responsivo) e a
**landing page** (site institucional para donos de barbearia).

## Funcionalidades

**App do cliente:** login/cadastro, escolha de barbearia (cliente é global), fluxo
de agendamento em 3 etapas (serviços **multi-select** → barbeiro → horário),
confirmação, perfil com **fidelidade** (pontos/tier), histórico e **edição de perfil**.
É uma **PWA instalável** (tela inicial, tela cheia, offline básico) — ver [PWA](#pwa-app-do-cliente).

**Painel do barbeiro/admin:** agenda diária com KPIs e **registro de pagamento por
linha**, solicitações (confirmar/recusar), clientes com tier, financeiro, **relatórios**
(com export PDF), **serviços** (CRUD), **horários** de funcionamento (dias + faixas) e
equipe. No mobile a navegação é um **menu drawer** (hambúrguer).

**Landing page** (`apps/site`): site estático institucional voltado para donos de
barbearia, com CTA que leva ao cadastro no painel (abre direto no modo cadastro via
`?cadastro=1`). Não depende da API.

**Regras:** pagamento **manual** (Pix/Cartão/Dinheiro — sem gateway), fidelidade
recalculada em tempo real, e **notificação por e-mail** ao cliente na confirmação
do agendamento e num **lembrete ~1h antes** (ver [Notificações](#notificações)).

## Estrutura

```
barbersync/
├── apps/
│   ├── api/        NestJS + TypeORM + PostgreSQL  (porta 3333)
│   ├── client/     Next.js 14 — app do cliente     (porta 3000, PWA)
│   ├── admin/      Next.js 14 — painel admin        (porta 3001)
│   └── site/       Next.js 14 — landing page        (porta 3002, estática)
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

# 5. Subir os apps (em terminais separados)
npm run dev:api      # http://localhost:3333/api
npm run dev:client   # http://localhost:3000
npm run dev:admin    # http://localhost:3001
npm run dev:site     # http://localhost:3002  (landing; não precisa da API)
```

Logins do seed: `admin@barbersync.com / 123456` (painel) e
`joao@cliente.com / 123456` (app do cliente).

### Testar no celular pela rede local

Os dev servers do Next escutam em `0.0.0.0`. Para abrir no celular (mesma Wi-Fi),
use o IP da máquina (`ipconfig`) em vez de `localhost`:

- No front (`apps/client/.env.local` ou `apps/admin/.env.local`):
  `NEXT_PUBLIC_API_URL=http://SEU_IP:3333/api`
- Na API (`apps/api/.env`), libere a origem no CORS: `CLIENT_ORIGIN` e `ADMIN_ORIGIN`
  aceitam **lista separada por vírgula** (ex.: `http://localhost:3000,http://SEU_IP:3000`).
- No Windows, libere as portas no firewall (3000/3001/3333) e garanta a mesma rede.

Reinicie a API após editar o `.env` (as variáveis só são lidas no boot).

## Multi-tenancy

Isolamento lógico por `tenant_id` (mesmo domínio para todas as barbearias). Todo
endpoint resolve o tenant no backend a partir do JWT — nunca confia num
`tenant_id` vindo cru do client. Detalhes em [CLAUDE.md](CLAUDE.md) §3 e em
`apps/api/src/common/tenant/tenant-context.ts`.

## Notificações

O cliente é notificado quando o barbeiro **confirma** um agendamento e novamente num
**lembrete ~1h antes** do horário (cron `AppointmentReminderService`, tick de 5min,
claim atômico → at-most-once). O sistema é **agnóstico de canal**
(`apps/api/src/modules/notifications/`): hoje há um canal de log (dev) e um de e-mail
(via [Resend](https://resend.com)). WhatsApp/SMS encaixam na mesma interface no futuro.

Configuração por env (em `apps/api/.env`):

```bash
# 'log' (padrão) só imprime no console; 'email' envia de verdade via Resend
NOTIFICATIONS_CHANNEL=log
RESEND_API_KEY=            # necessário quando NOTIFICATIONS_CHANNEL=email
MAIL_FROM=BarberSync <no-reply@seudominio.com>
```

Para ativar o envio real: criar conta no Resend, **verificar um domínio**, definir
`NOTIFICATIONS_CHANNEL=email` + `RESEND_API_KEY` + `MAIL_FROM` e reiniciar a API.
Sem domínio verificado, o Resend entrega apenas para o seu próprio e-mail (teste).
O envio é *fire-and-forget*: uma falha não bloqueia a confirmação do agendamento.

## PWA (app do cliente)

O `apps/client` é instalável como app (Android/iOS/desktop). Peças:
`src/app/manifest.ts` (manifest), `public/sw.js` (service worker), `public/offline.html`
(tela offline), `public/icons/` (ícones + maskable, gerados da tesoura do design system)
e `src/components/pwa-register.tsx` (registro).

- **Service worker só roda em produção.** Em dev ele serviria assets velhos do HMR.
  Para testar a PWA: `npm run build --workspace @barbersync/client` + `npx next start`.
- **Instalação exige contexto seguro** (`https://` ou `localhost`). Um IP de LAN
  (`http://192.168.x.x`) o navegador trata como inseguro e não oferece instalar —
  use `localhost`, port forwarding via USB (`chrome://inspect`) ou HTTPS (deploy/túnel).
- Cache conservador: navegação é rede-primeiro, estáticos cache-primeiro, a API
  nunca é cacheada (o app é autenticado).

## Deploy / Infra

O passo a passo dos dashboards fica num runbook local (`DEPLOY.md`, **fora do
versionamento**). O que está no repo é a configuração que os provedores leem:

| Componente | Onde | Observação |
|---|---|---|
| API (NestJS) | Render — Blueprint [`render.yaml`](render.yaml) | free tier hiberna após ~15min; escuta em `0.0.0.0`; migrations rodam no start |
| Postgres | Neon (free) | via `DATABASE_URL` + `DB_SSL=true`; `DB_SYNC=false` |
| site (landing) | Vercel — Root Directory `apps/site` | estática; não precisa da API. `NEXT_PUBLIC_ADMIN_URL` → domínio do painel |
| client + admin | Vercel (dois projetos) | Root Directory por app; apontam `NEXT_PUBLIC_API_URL` p/ a API |
| Segredos | env do provedor (`sync: false` no `render.yaml`) | `JWT_SECRET`, `DATABASE_URL`, `RESEND_API_KEY` |

**Health check:** `GET /api/health` (público, não toca no banco de propósito —
uma Neon lenta não deve derrubar o deploy).

**CORS em produção:** a API aceita `CORS_ORIGINS` (lista separada por vírgula com as
URLs dos fronts na Vercel). Em dev, `CLIENT_ORIGIN`/`ADMIN_ORIGIN` continuam valendo.
Nunca use `origin:'*'` — a API responde com `credentials:true`.

**Schema:** produção usa **migrations** (`npm run migration:run`); o
`synchronize` é forçado a `false` quando `NODE_ENV=production`, independente do
`DB_SYNC`. Em dev, `DB_SYNC=true` continua valendo.

Scripts de migration (workspace `@barbersync/api`):

| Script | O que faz |
|---|---|
| `npm run migration:generate -- src/database/migrations/Nome` | gera migration pelo diff entities ↔ banco |
| `npm run migration:run` | aplica as pendentes (ts-node, dev) |
| `npm run migration:revert` | desfaz a última |
| `npm run migration:show` | lista aplicadas/pendentes |
| `npm run migration:run:prod` | aplica sobre `dist/` (roda no start em produção) |

> Para gerar uma migration nova sem um banco "na versão anterior" à mão, use um
> banco de rascunho: `docker exec barbersync-db psql -U postgres -c "CREATE
> DATABASE barbersync_mig;"`, rode `DB_NAME=barbersync_mig DB_SYNC=false npm run
> migration:run` (sobe até a última) e só então o `migration:generate`. Confira
> depois que um segundo `generate` diz *"No changes in database schema"*.
