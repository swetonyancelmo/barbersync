# BarberSync — Contexto para Claude Code

Este arquivo é a fonte de verdade para qualquer sessão do Claude Code trabalhando no BarberSync. O design abaixo foi extraído de um protótipo completo (18 telas) feito no Claude Design — cobre o app do cliente e o painel do barbeiro (web + mobile responsivo).

> **⚡ Estado atual (atualizado 2026-07-03):** o projeto **já está implementado e funcional** — leia a seção **§0** antes de qualquer coisa. As seções seguintes (design, telas, regras) descrevem a intenção original; onde a implementação divergiu ou decidiu algo, a §0 e as notas inline "✅ implementado" mandam.

## 0. Estado atual da implementação

**Monorepo npm workspaces** (pnpm NÃO está instalado na máquina — use `npm`):

```
barbersync/
├── apps/api        NestJS 11 + TypeORM + PostgreSQL   (porta 3333, prefixo /api)
├── apps/client     Next.js 14 — app do cliente         (porta 3000, mobile-first + responsivo desktop)
├── apps/admin      Next.js 14 — painel admin           (porta 3001, desktop-first + responsivo mobile)
└── packages/shared enums, tipos e regras compartilhadas (@barbersync/shared)
```

**Como rodar:** `docker compose up -d db` → `npm install` → `npm run build:shared` → `cp apps/api/.env.example apps/api/.env` → `npm run seed --workspace @barbersync/api` → `npm run dev:api | dev:client | dev:admin`. Seed cria `admin@barbersync.com` e `joao@cliente.com` (senha `123456`).

**Módulos do backend** (`apps/api/src/modules/`): `auth` (JWT, login + cadastro cliente/barbearia), `tenants`, `users`, `barbers`, `services`, `appointments`, `payments`, `loyalty`, `schedule`, `notifications`. Guards globais `JwtAuthGuard` + `RolesGuard`. A resolução de tenant vive em `common/tenant/tenant-context.ts` (`resolveTenantId`).

**Decisões técnicas travadas com o Swetony:**
- API **REST** (não GraphQL).
- **Multi-select de serviços** no agendamento → `Agendamento` tem ManyToMany com `Servico` (tabela `agendamento_servicos`) + snapshot `valorTotal`/`duracaoTotalMin`.
- **Cliente é global multi-tenant**: `User.tenantId` é NULL para CLIENTE (agenda em várias barbearias); BARBEIRO/ADMIN têm tenant fixo. O cliente escolhe a barbearia (`?tenantId=`), o backend valida.
- **Disponibilidade por barbearia** (não por barbeiro): módulo `schedule` (`Expediente`) guarda dias abertos + faixas de horário (jsonb). A grade do cliente lê disso; padrão seg–sáb, domingo fechado.

**Notificações (✅ implementado):** módulo `notifications` **agnóstico de canal** (`NotificationChannel` → `LogChannel` dev + `ResendChannel` e-mail via API HTTP, sem SDK). Ao **confirmar** um agendamento (`setStatus` → `CONFIRMADO`), notifica o cliente — **idempotente** (só na transição) e **fire-and-forget** (falha de envio não derruba a confirmação). Canal via env `NOTIFICATIONS_CHANNEL=log|email` (+ `RESEND_API_KEY`, `MAIL_FROM`); padrão `log`. WhatsApp e outros eventos (recusado) encaixam na mesma interface.

**Lembrete "1h antes" (✅ implementado 2026-07-19):** cron `AppointmentReminderService` (`apps/api/src/modules/appointments/appointment-reminder.service.ts`, `@nestjs/schedule` — importado no `app.module.ts` como `NestScheduleModule` para não colidir com o `ScheduleModule` de expediente). Tick a cada 5min varre `CONFIRMADO` com `dataHora` em `[now, now+60min]` e `lembrete_enviado_em IS NULL`; **claim atômico** (`UPDATE ... WHERE lembrete_enviado_em IS NULL`) antes de enviar → at-most-once mesmo com múltiplas instâncias. Template `appointment-reminder.template.ts` + `notifyAppointmentReminder` no mesmo padrão do confirmado.

**Relatórios (✅ implementado 2026-07-19):** aba **Relatórios** no admin (`/relatorios`) + módulo `reports` no backend. `GET /reports/summary?periodo=dia|semana|mes&data=YYYY-MM-DD` (ADMIN/BARBEIRO) retorna `ReportSummary` (`@barbersync/shared`): KPIs (recebido por `pago_em`, atendimentos concluídos por `data_hora` — eixos diferentes de propósito), série diária, quebra por barbeiro, top 5 clientes (visitas+gasto+tier) e top 5 serviços (via `agendamento_servicos`; receita **aproximada** pelo preço atual — não há snapshot por serviço). Agrupamento por dia usa `AT TIME ZONE` com env `REPORTS_TIMEZONE` (default `America/Sao_Paulo`; o Postgres do docker é UTC). **Export PDF**: `GET /reports/summary/pdf` (pdfkit, `reports-pdf.service.ts`, reusa o mesmo `summary()` → paridade tela↔PDF); front baixa via `apiDownload` (`apps/admin/src/lib/api.ts`, fetch+blob por causa do Bearer). UI: pills Dia/Semana/Mês + ◀ ▶ + Hoje, 3 KPIs, gráfico de barras SVG/CSS sem lib (só semana/mês) e 3 tabelas.

**Paginação (✅ implementado 2026-07-19):** contrato `Paginated<T>` em `@barbersync/shared` + `PaginationQueryDto` (`apps/api/src/common/dto/pagination-query.dto.ts`, page/limit com default 1/20, max 100). Aplicada em `GET /appointments/me` (histórico — front cliente usa botão "Carregar mais", limit 10) e `GET /users/clientes` (tabela do admin com paginador numérico, limit 20; `orderBy u.nome` obrigatório para páginas estáveis com `distinct`). Esses dois endpoints agora retornam `{items,total,page,limit}` (breaking para consumidores antigos).

**Editar perfil (✅ implementado):** `PATCH /users/me` (`UpdateProfileDto`) atualiza nome/telefone; no app do cliente, "Editar perfil" abre modal e atualiza a sessão via `updateUser` no contexto de auth. E-mail é read-only por ora (edição virá com a verificação/notificações por e-mail). O item "Notificações" saiu do menu Conta (será automático).

**Defaults aplicados (marcados no código, podem mudar):** fidelidade recalculada em tempo real a cada pagamento (regra inferida, centralizada em `@barbersync/shared`); barbeiro "Master" = só label; lembrete "1h antes" com tick de 5min (cliente recebe entre ~55–60min antes).

**Gotchas de ambiente:** há um **Postgres nativo do Windows na 5432** → o docker-compose publica o banco em **5433** (`DB_PORT=5433`). O `apps/api/tsconfig.json` **não** mapeia `@barbersync/shared` para o source e tem `incremental:false` — não reative nenhum dos dois (senão o `nest build` emite em `dist/apps/api/...` ou pula a emissão e some o `dist/main.js`).

**Skills do projeto** (`.claude/skills/`): `nestjs-module` (padrão de módulo backend + tenant), `barbersync-run-verify` (rodar/seed/e2e + gotchas de ambiente), `barbersync-ui` (design system dos fronts), `notification-channel` (adicionar canal/evento de notificação). Use-as ao mexer nas áreas correspondentes.

**Pendências conhecidas:** sem migrations TypeORM (usa `DB_SYNC=true` em dev); design real do Claude Design não foi importado (MCP pediu consentimento em sessão não-interativa — tokens vieram desta doc + refino visual da §4); infra de produção não provisionada (alvo sugerido no README).

## 1. Visão geral

BarberSync é uma plataforma SaaS multi-tenant de agendamento para barbearias, com dois front-ends consumindo a mesma API:

- **App do Cliente** (mobile-first) — cliente final agenda horários, acompanha fidelidade e histórico.
- **Painel do Barbeiro/Admin** (web responsivo, também usado em mobile) — barbearia gerencia agenda, solicitações, clientes, financeiro e equipe.

## 2. Stack técnica

- **Backend:** NestJS + PostgreSQL + TypeORM. **✅ REST** (decidido — não GraphQL).
- **Frontend:** Next.js 14 (App Router). **✅ dois apps separados** em npm workspaces (`apps/client`, `apps/admin`), não route groups.
- **Auth:** login por e-mail/senha via JWT (bcrypt). Cliente tem cadastro próprio; admin tem "Cadastre sua barbearia" (cria Tenant + usuário ADMIN).

## 3. Multi-tenancy

- **Modelo:** mesmo domínio para todas as barbearias. Isolamento lógico via `tenant_id` (não há subdomínio por barbearia).
- Toda entidade operacional (agendamentos, clientes, financeiro, equipe) deve carregar `tenant_id` e ser filtrada por ele em toda query — nunca confiar em filtro só no frontend.
- **✅ implementado:** BARBEIRO/ADMIN têm `tenant_id` fixo no JWT; CLIENTE é **global** (`tenant_id` NULL) e agenda em várias barbearias, informando qual em cada operação (validado no backend). Lógica em `common/tenant/tenant-context.ts`.
- **Atenção:** como não há isolamento por domínio, todo endpoint do backend precisa de guard/interceptor que injete e valide `tenant_id` a partir do JWT — nunca aceitar `tenant_id` vindo do client sem validação.

## 4. Design system

> **✅ Redesenhado (2026-07-17) — tema "Azulejaria de esquina".** O visual anterior (escuro premium: latão/oxblood/Bodoni) caía num dos clichês "cara de IA" (fundo quase-preto + acento dourado em gradiente). Foi substituído por uma identidade ancorada na **barbearia de bairro brasileira**. O sistema de tokens real está em `apps/client/src/app/globals.css` e `apps/admin/src/app/globals.css` (com bloco de aliases mapeando nomes antigos → novos: `--gold-1`→`--pole`, `--brass-light`→`--pine`, `--surface`→`--tile` etc., para as telas re-skinnarem sem reescrita). Resumo do que vale hoje:
> - **Tema CLARO — porcelana + azulejo + verde-esmalte + vermelho de poste.** Superfícies: `--porcelain #ECE9DD` (fundo, com rejunte sutil) → `--tile #FCFBF7` (azulejo/card) → `--tile-2 #F2EFE4` (hover), `--cream #F3ECD9` (papel de comanda), rejunte/borda `--line #D9D5C4`. Estrutural: `--pine #1E3A33` (verde-esmalte — chrome/sidebar/nav/plaquinhas). Acento **único e comedido**: `--pole #C0392B` (vermelho de poste — CTA/seleção/aba ativa); `--navy` só no filete do poste. Texto `--ink #26241C` / `--slate #6E6A5B`.
> - **Fontes via `next/font/google`:** `Fjalla One` (display/marca — grotesca condensada de letreiro esmaltado; **substituiu Bodoni**), `Hanken Grotesk` (corpo), `Space Mono` (dados — horas, preços, KPIs, numerais de tabela). Classes: `.display`, `.mono`.
> - **Elementos de assinatura:** `.barber-rule` (filete do **poste de barbeiro** vermelho/creme/azul — aba ativa, stepper, sob títulos), `.ticket`/`.ticket-perf` (comanda de papel com picote — próximo agendamento, confirmação) e `.plaque` (plaquinha de esmalte verde). Chrome (nav do cliente, sidebar do admin) = superfície verde-esmalte com marca em creme e detalhe de poste vermelho.
> - **Escalas variadas** (contra "cara de IA"): raios `--r-ticket 3 / input 8 / card 10 / pill 999`, sombras `--elev-hairline/raised/float`, espaçamento `--s1..--s7`. Ícones **inline SVG curados** em `components/icons.tsx` (sem emoji).
> - **Dark mode (✅ 2026-07-17):** mesma paleta em dois temas (claro=dia, escuro=noite). Tokens redefinidos em `:root[data-theme='dark']` + fallback `@media (prefers-color-scheme: dark)`. **Default = sistema**; toggle (`components/theme-toggle.tsx`) persiste a escolha em `localStorage['bs-theme']`, resolvido antes da pintura por script inline no root layout (`<html suppressHydrationWarning>`). Regra dos verdes: `--pine` = chrome (constante escuro), `--verd` = acento sobre superfície (clareia p/ sage no escuro). Detalhes no skill `barbersync-ui`.
>
> O texto abaixo é a intenção visual **original** (dos prints, tema escuro) — mantido só como referência histórica; **o token system claro implementado manda** onde divergir.

**Cores**
- Fundo: preto quase puro, tom quente (`#0D0B08` a `#120F0C`)
- Superfícies/cards: leve elevação sobre o fundo, borda sutil marrom escura (`#2A2118` aprox.)
- Acento primário (CTAs, destaques, ícones): dourado, geralmente em gradiente (`#D4A056` → `#F0C878`)
- Texto principal: bege/creme claro (`#F5EFE6` aprox.)
- Texto secundário/muted: marrom-acinzentado (`#8A7F6E` aprox.)
- Sucesso / "Concluído" / "Pago": verde suave
- Status "Confirmado": outline dourado
- Status "Pendente": cinza neutro
- Ação destrutiva (ex: "Sair", "Recusar"): laranja-avermelhado

**Tipografia**
- Títulos e destaques emocionais (`BarberSync`, `Bem-vindo de volta`, `Agendamento confirmado!`): serifada (estilo Playfair Display/Georgia) — transmite a identidade "barbearia clássica/premium"
- UI geral (labels, botões, tabelas, inputs): sans-serif (estilo Inter/system-ui)

**Componentes recorrentes**
- Botão primário: fundo em gradiente dourado, texto escuro, bem arredondado (pill)
- Botão secundário/outline: borda fina, fundo transparente
- Card de item de lista: fundo levemente elevado, borda sutil, padding generoso
- Indicador de progresso (fluxo de agendamento): dots/barras no topo mostrando etapa atual (3 etapas: serviço → barbeiro → horário)
- Avatar: círculo com iniciais do nome (sem foto)
- Badge de status/tier: pill pequena colorida (Ouro/Prata/Bronze, Confirmado/Concluído/Pendente, Pago·Pix/Cartão/Dinheiro)

## 5. App do Cliente — inventário de telas

| Tela | Elementos principais | Estados a cobrir |
|---|---|---|
| **Login** | logo + nome, e-mail, senha, CTA "Entrar", link "Cadastre-se" | erro de credenciais, campos vazios, loading |
| **Home** | saudação com nome, badge de pontos, card "Próximo agendamento", CTA "Reservar novo horário", lista de barbeiros (avatar, nome, rating), lista de serviços (nome, duração, preço) | sem próximo agendamento, lista de barbeiros/serviços vazia |
| **Escolha o serviço** (etapa 1/3) | lista de serviços com descrição, duração, preço; footer com total e "Continuar" | nenhum serviço selecionado (Continuar desabilitado), múltipla seleção? *(confirmar se é single ou multi-select)* |
| **Escolha o barbeiro** (etapa 2/3) | lista de barbeiros com especialidade e rating; footer com total acumulado | nenhum barbeiro disponível no horário desejado |
| **Escolha o horário** (etapa 3/3) | seletor de data (chips horizontais), grade de horários Manhã/Tarde; footer com total e "Confirmar" | horário indisponível/ocupado (não deve aparecer na grade ou aparecer desabilitado) |
| **Confirmação** | ícone de sucesso, resumo (serviço, barbeiro, data/hora, valor), CTAs "Voltar ao início" / "Ver meu perfil" | falha ao confirmar (ex: horário ocupado no meio tempo) |
| **Perfil** | dados do cliente, barra de progresso de fidelidade (pts atual/meta, texto "faltam X pts para Y"), histórico de agendamentos, menu Conta (**Editar perfil** ✅ funcional via modal, Formas de pagamento "em breve", Sair — item "Notificações" removido, ver §0) | histórico vazio (cliente novo) |

Navegação: bottom tab bar fixa com 3 itens — **Início / Agendar / Perfil**.

## 6. Painel do Barbeiro/Admin — inventário de telas

Layout desktop: sidebar fixa à esquerda (logo, menu, usuário logado + Sair no rodapé). Layout mobile: bottom tab bar com "Sair" no header.

> **✅ implementado:** o menu tem **7 itens** — além de Agenda, Solicitações, Clientes, Financeiro e Equipe, foram adicionados **Serviços** (CRUD do catálogo) e **Horários** (dias/faixas de funcionamento — módulo `schedule`). A **Agenda** ganhou a ação de registrar pagamento por linha (ver §7).

| Tela | Elementos principais | Estados a cobrir |
|---|---|---|
| **Login** | logo, "Acesse seu painel", e-mail, senha, CTA "Entrar", link "Cadastre sua barbearia" | erro de credenciais |
| **Agenda** | navegação de data (◀ Hoje ▶), 3 cards de KPI (atendimentos hoje, faturado hoje, barbeiros ativos), tabela/lista de agendamentos do dia (hora, cliente, serviço, barbeiro, status) | dia sem agendamentos |
| **Solicitações** | contador de pendentes no menu (badge numérica), lista "Aguardando resposta" com Recusar/Confirmar, seção "Respondidas recentemente" | nenhuma solicitação pendente |
| **Clientes** | busca por nome/telefone, tabela (nome, telefone, última visita, total gasto, tier) | busca sem resultado |
| **Financeiro** | 4 cards de KPI (recebido hoje, a receber hoje, ticket médio, atendimentos hoje), lista de atendimentos do dia com ação inline "Registrar pagamento" → expande seletor de forma de pagamento (Pix/Cartão/Dinheiro) + "Confirmar recebimento" | atendimento já pago (mostra badge "Pago·[forma]" ao invés do botão) |
| **Equipe** | cards de barbeiros (avatar, nome, especialidade, telefone, status Ativo, Remover), card "+ Adicionar barbeiro" | remover barbeiro com agendamentos futuros (precisa de confirmação/bloqueio) |

## 7. Regras de negócio

**Pagamento — confirmado: só registro manual.**
O barbeiro marca manualmente "Pago" e a forma (Pix/Cartão/Dinheiro) depois do atendimento. Não há checkout ou cobrança online nesta fase — nada de integração com gateway de pagamento por enquanto. Deixar a modelagem preparada para adicionar isso depois, mas não implementar checkout agora.
> **✅ implementado:** registro manual disponível em **duas telas** — na **Agenda** diária (ação "Marcar pago" por linha) e no **Financeiro**. Registrar pagamento marca o agendamento como `CONCLUIDO` e recalcula a fidelidade. Endpoint `POST /payments`; status do dia via `GET /payments/day`.

**Fidelidade e tiers — confirmado: regra fixa.**
Com base nos valores visíveis nos prints, a regra inferida é:

- **Pontos:** 1 ponto a cada R$3 gastos (ex: Rafael Souza — R$540 em gasto total ≈ 180 pts, batendo com o valor mostrado no perfil)
- **Recompensa:** ao atingir 250 pts, cliente ganha 1 serviço grátis (no exemplo, "barba grátis" — sugere que a recompensa pode ser configurável por tipo de serviço, mas o valor de pontos necessário é fixo em 250)
- **Tiers por total gasto histórico:**
  - Bronze: R$0 – R$199
  - Prata: R$200 – R$499
  - Ouro: R$500+

> ⚠️ Essas faixas foram **inferidas comparando os valores dos prints** (não vieram de uma especificação explícita). Bateram consistentemente com os 6 clientes de exemplo, mas vale confirmar com o Swetony antes de travar no banco — especialmente o valor de conversão pontos↔reais e se o tier deve ser recalculado em tempo real ou em batch.

**Status de agendamento:** `Pendente` → `Confirmado` → `Concluído` (ou `Recusado`, que sai do fluxo). Toda solicitação de cliente entra como `Pendente` até o barbeiro confirmar ou recusar em "Solicitações".

**Lembrete de agendamento:** ✅ implementado por e-mail via cron (ver §0 — `AppointmentReminderService`).

## 8. Modelo de dados

> **✅ Schema real implementado** (entidades TypeORM em `apps/api/src/modules/*/*.entity.ts`) diverge do rascunho abaixo em pontos importantes:
> - `User.tenant_id` é **nullable** (NULL para CLIENTE global).
> - `Agendamento` **não tem `servico_id` único** — usa ManyToMany `agendamento_servicos` (multi-select) + snapshot `valor_total`/`duracao_total_min`.
> - `Pagamento` carrega `tenant_id` e `valor`; `Fidelidade` é única por (`cliente_id`,`tenant_id`).
> - Entidade nova **`Expediente`** (tabela `expedientes`): `tenant_id`, `dia_semana` (0–6), `aberto`, `blocos` (jsonb de `{inicio,fim}`).
>
> O rascunho abaixo é a intenção original.

```
Tenant (barbearia)
  id, nome, criado_em

User (compartilhado entre client e admin, com role)
  id, tenant_id, nome, email, senha_hash, role (CLIENTE | BARBEIRO | ADMIN), telefone

Barbeiro (perfil estendido de User quando role=BARBEIRO)
  id, user_id, tenant_id, especialidade, rating, ativo

Servico
  id, tenant_id, nome, descricao, duracao_min, preco

Agendamento
  id, tenant_id, cliente_id, barbeiro_id, servico_id, data_hora, status, valor

Pagamento
  id, agendamento_id, forma (PIX | CARTAO | DINHEIRO), pago_em

Fidelidade
  id, cliente_id, tenant_id, pontos_atuais, total_gasto_historico, tier (calculado ou persistido)
```

## 9. Convenções técnicas (BarberSync)

- Stack confirmada no projeto: **NestJS** (backend) + **Next.js 14** (frontend), conforme já usado no restante do BarberSync.
- Todo módulo NestJS novo segue o padrão do skill `nestjs-module` já configurado no projeto (controller, service, entity, DTO).
- Toda query de leitura/escrita passa por filtro de `tenant_id` — nunca confiar em `tenant_id` vindo do body/query do client.
- Nomes de componentes React devem seguir os nomes visíveis no design (ex: `AppointmentCard`, `BarberAvatar`, `LoyaltyProgressBar`, `PaymentStatusBadge`) para manter rastreabilidade entre design e código.
- Dois apps Next.js distintos (ou dois grupos de rotas) — client mobile-first, admin desktop-first com responsividade para mobile.

## 10. Definition of done

- [ ] Renderiza sem quebra em mobile (375px) e desktop (1280px+)
- [ ] Todos os estados vazios/erro listados na seção 5 e 6 estão tratados
- [ ] `tenant_id` validado no backend em todo endpoint novo (nunca confiar no client)
- [ ] Cores e tipografia batendo com a seção 4 (design system)
- [ ] Fluxo de agendamento (serviço → barbeiro → horário → confirmação) funcional ponta a ponta
- [ ] Registro manual de pagamento funcional (sem gateway)
- [ ] Cálculo de tier/pontos de fidelidade implementado conforme seção 7, com a ressalva documentada no código (comentário apontando que a regra foi inferida do design e pode mudar)

## 11. Perguntas em aberto — status

- ~~Seleção de serviço single vs multi?~~ **✅ Multi-select** (confirmado).
- ~~Cliente em mais de uma barbearia?~~ **✅ Sim, cliente global** (confirmado).
- ~~Disponibilidade por barbearia ou por barbeiro?~~ **✅ Por barbearia** (confirmado; evoluir p/ por-barbeiro depois se preciso).
- Canal de notificação? **✅ e-mail primeiro** (via Resend, canal plugável) — dispara na **confirmação** e no **lembrete "1h antes"** (cron ✅). WhatsApp fica para depois (custo por mensagem + aprovação Meta).
- Barbeiro "Master" tem permissão diferente? — **default: não**, só label. Confirmar se deve mudar.
- Confirmar com o Swetony as **faixas de fidelidade inferidas** (1pt/R$3, meta 250, Bronze/Prata/Ouro) antes de tratar como final.