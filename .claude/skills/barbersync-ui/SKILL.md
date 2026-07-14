---
name: barbersync-ui
description: >
  Use ao criar ou editar qualquer tela/componente dos fronts do BarberSync
  (apps/client mobile-first, apps/admin desktop-first) para manter o design
  system — paleta em camadas, fontes (Bodoni/Hanken/Space Mono), elementos de
  assinatura (barber-rule, ticket), escalas de raio/sombra/espaço, ícones SVG
  curados e os padrões responsivos. Evita "cara de IA" genérica. Gatilhos:
  "nova tela", "novo componente", "ajustar o visual", "estilizar", "página do
  cliente/admin".
---

# Design system do BarberSync

Tokens em `apps/client/src/app/globals.css` e `apps/admin/src/app/globals.css`
(há um bloco de **aliases** mapeando nomes antigos: `--gold-2`→`--brass-light` etc.).
Identidade = barbearia clássica/premium, **não** SaaS escuro genérico.

## Paleta (profundidade em 3 camadas + 2 acentos)

- Escuros: `--pitch #0E0B07` (fundo) → `--espresso #1B1510` (card) → `--walnut #251C14` (levantado), borda `--oak #3A2E1F` / `--oak-soft`.
- Acentos: `--brass #C89B4C` (latão fosco — **uso comedido**, `--brass-light` p/ brilho) e `--oxblood #8A3B33` (couro/barber-pole).
- Texto: `--bone #EFE7D6` / `--smoke #9A8E79`. Status: `--ok`, `--danger`.
- Não use hex cru nas telas — use as variáveis. Profundidade vem de camada+borda, **não** de gradiente repetido.

## Tipografia (3 vozes — via `next/font/google` em `app/fonts.ts`)

- **Display** `Bodoni Moda` (classe `.display`, e `h1/h2/h3` já usam) — marca, títulos, momentos emocionais. **Nunca** Playfair.
- **Corpo** `Hanken Grotesk` — UI, labels, texto.
- **Dados** `Space Mono` (classe `.mono`) — **horas, preços, KPIs, numerais de tabela, telefone**. Sempre formate dinheiro com `brl()` e aplique `.mono`.

## Elementos de assinatura (o que torna "barbearia")

- **`.barber-rule`** — filete listrado barber-pole. Use com parcimônia: indicador de aba/menu ativo, stepper do agendamento, sob títulos de seção (`width` pequena).
- **`.ticket` + `.ticket-perf`** — card em formato de comanda (cantos ~retos, picote). Use no "próximo agendamento" e na confirmação. Não use para tudo.
- **Ícones**: set curado inline em `components/icons.tsx` (traço 1.5, grade 24). **Sem emoji.** Precisa de um ícone novo? Adicione lá no mesmo estilo. Use ícone só onde ajuda (nav, status, estados vazios).

## Escalas (evite uniformidade)

- Raio **variado de propósito**: `--r-ticket 3px` · `--r-input 7px` · `--r-card 12px` · `--r-pill 999px`.
- Sombra em 3 tiers semânticos: `--elev-hairline` (cards chapados) · `--elev-raised` · `--elev-float` (modais/hero). Nada de sombra genérica solta.
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
