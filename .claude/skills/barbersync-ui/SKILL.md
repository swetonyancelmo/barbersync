---
name: barbersync-ui
description: >
  Use ao criar ou editar qualquer tela/componente dos fronts do BarberSync
  (apps/client mobile-first, apps/admin desktop-first) para manter o design
  system "Azulejaria" — paleta clara+escura (porcelana/azulejo/verde-esmalte/
  vermelho de poste; dark mode com toggle), fontes (Fjalla One/Hanken/Space Mono), elementos de assinatura
  (barber-rule do poste, ticket, plaque), escalas de raio/sombra/espaço, ícones SVG
  curados e os padrões responsivos. Evita "cara de IA" genérica. Gatilhos:
  "nova tela", "novo componente", "ajustar o visual", "estilizar", "página do
  cliente/admin".
---

# Design system do BarberSync

Tokens em `apps/client/src/app/globals.css` e `apps/admin/src/app/globals.css`
(há um bloco de **aliases** mapeando nomes antigos → tokens do tema claro:
`--gold-1`→`--pole`, `--brass-light`→`--pine`, `--surface`→`--tile` etc.).
Identidade = **barbearia de esquina brasileira** ("Azulejaria"): porcelana clara,
azulejo branco com rejunte, verde-esmalte estrutural, vermelho de poste de
barbeiro como **único** acento forte. **Tema claro** — não é mais SaaS escuro.

## Paleta (superfícies claras + verde estrutural + vermelho de acento)

- Superfícies: `--porcelain #ECE9DD` (fundo, com rejunte sutil) → `--tile #FCFBF7` (azulejo/card) → `--tile-2 #F2EFE4` (hover), `--cream #F3ECD9` (papel de comanda). Borda/rejunte `--line #D9D5C4`.
- **Dois verdes (regra importante):** `--pine #1E3A33` = verde de **chrome** (barra/sidebar/plaquinha, com texto creme por cima) — fica escuro nos dois temas. `--verd` = verde de **acento sobre superfície** (preço, avatar, progresso, contorno, filete do KPI, foco) — clareia p/ sage no escuro. Nunca use `--pine` como texto/acento sobre card (some no dark); use `--verd`. `--pine-2`/`--verd-2` para gradiente.
- Acento **único e comedido**: `--pole #C0392B` (vermelho de poste — CTA, seleção, aba ativa). `--navy` só entra no filete listrado do poste.
- Texto: `--ink` / `--slate`. Creme sobre chrome verde/vermelho = `--on-enamel`/`--on-pole`. Metais `--brass` (fidelidade). Status `--ok`, `--danger`. Tiers ouro/prata/bronze.
- Não use hex cru nas telas — use as variáveis. Profundidade vem de camada+rejunte+sombra, **não** de gradiente.

## Temas claro/escuro

Dois temas na mesma paleta (claro = dia, escuro = noite). Tokens semânticos (`--porcelain`, `--tile`, `--ink`, `--line`, `--verd`, `--pole`, sombras, textura…) são redefinidos em `:root[data-theme='dark']` **e** no fallback `@media (prefers-color-scheme: dark) :root:not([data-theme='light'])`. As classes/telas nunca mudam por tema — só consomem os tokens, que viram os valores certos sozinhos. Tints de badge/tabela usam `color-mix(in srgb, var(--token) N%, transparent)` p/ adaptarem.

- **Default = sistema.** Um script inline no root layout resolve o tema antes da pintura (lê `bs-theme` do localStorage; se vazio, usa `prefers-color-scheme`) e escreve `data-theme` no `<html>`. O `<html>` tem `suppressHydrationWarning`.
- **Toggle:** `components/theme-toggle.tsx` (`<ThemeToggle />`, ou `chrome` quando sobre barra verde). Está na barra do cliente + menu Conta do perfil + login; e na sidebar/header do admin + login. Ao criar tela nova com chrome próprio, garanta um ponto de acesso ao toggle.
- Ao adicionar cor nova, **defina o par claro/escuro** nos dois blocos (não deixe hex cru que só serve num tema).

## Tipografia (3 vozes — via `next/font/google` em `app/fonts.ts`)

- **Display** `Fjalla One` (classe `.display`, e `h1/h2/h3` já usam) — grotesca condensada de letreiro esmaltado; marca, títulos, plaquinhas. Peso único 400. **Nunca** Bodoni/Playfair (era o clichê antigo).
- **Corpo** `Hanken Grotesk` — UI, labels, texto.
- **Dados** `Space Mono` (classe `.mono`) — **horas, preços, KPIs, numerais de tabela, telefone**. Sempre formate dinheiro com `brl()` e aplique `.mono`.

## Elementos de assinatura (o que torna "barbearia")

- **`.barber-rule`** — filete do **poste de barbeiro** (listras vermelho/creme/azul). Use com parcimônia: indicador de aba/menu ativo, stepper do agendamento, sob títulos de seção (`width` pequena).
- **`.ticket` + `.ticket-perf`** — card em formato de comanda de papel (`--cream`, cantos ~retos, filete do poste no topo, picote). Use no "próximo agendamento" e na confirmação. Não use para tudo.
- **`.plaque`** — plaquinha de esmalte verde (fundo `--pine`, texto creme) p/ título de seção sobre placa. Chrome (nav/sidebar) usa a mesma superfície verde.
- **Ícones**: set curado inline em `components/icons.tsx` (traço 1.5, grade 24). **Sem emoji.** Precisa de um ícone novo? Adicione lá no mesmo estilo. Use ícone só onde ajuda (nav, status, estados vazios).

## Escalas (evite uniformidade)

- Raio **variado de propósito**: `--r-ticket 3px` · `--r-input 8px` · `--r-card 10px` · `--r-pill 999px`.
- Sombra em 3 tiers semânticos (claros/suaves no tema Azulejaria): `--elev-hairline` (azulejo chapado) · `--elev-raised` · `--elev-float` (modais/hero). Nada de sombra genérica solta.
- Espaçamento na escala de 4: `--s1..--s7`.

## Componentes prontos (classes)

`.card` / `.card-raised`, `.btn-primary` (gradiente latão) / `.btn-outline` / `.btn-danger` / `.btn-success`, `.input`, `.label` (mono, uppercase), `.badge-*` (success/confirm/pending/danger/ouro/prata/bronze), `.avatar`. Admin ainda tem `.kpi` (número em mono, filete de latão) e `.table`.

Componentes React seguem os nomes do design: `AppointmentCard`, `BarberAvatar`, `StatusBadge`, `TierBadge`, `PaidBadge` (em `components/ui.tsx`).

## Responsivo (manter os dois modos)

- **Client** (`apps/client/src/app/(app)/layout.tsx`): mobile = bottom tab bar; **≥900px** = top bar horizontal + conteúdo mais largo (styled-jsx global). Shell centralizado.
- **Admin** (`apps/admin/src/app/(dashboard)/layout.tsx`): desktop = sidebar fixa; **≤900px** = header + bottom nav. Badge de pendentes no item Solicitações.

## Checklist ao entregar uma tela

- Renderiza a 375px **e** 1280px+ sem quebrar (largura do body nunca rola na horizontal).
- Estados vazio/erro tratados.
- Tokens (não hex); dados numéricos em `.mono`; título com `.display` + `.barber-rule` quando fizer sentido.
- Ícones do set curado; nada de emoji.
