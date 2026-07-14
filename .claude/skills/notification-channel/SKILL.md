---
name: notification-channel
description: >
  Use ao mexer nas notificações do BarberSync — adicionar um canal novo
  (WhatsApp, SMS), um evento novo (agendamento recusado, lembrete "1h antes")
  ou trocar o provedor de e-mail. Explica a interface agnóstica de canal, o
  disparo fire-and-forget/idempotente a partir dos services de domínio, os
  templates e a configuração por env. Gatilhos: "notificação por WhatsApp",
  "enviar e-mail/SMS", "lembrete de agendamento", "avisar o cliente".
---

# Notificações no BarberSync

Módulo em `apps/api/src/modules/notifications/`. É **agnóstico de canal**: o
domínio chama o `NotificationsService`, que despacha no canal ativo (env).

## Peças

- `channels/notification-channel.ts` — interface `NotificationChannel { name; send(NotificationMessage) }` e `NotificationMessage { emailTo, phoneTo?, subject, html, text }` (serve e-mail agora e telefone/WhatsApp depois).
- `channels/log.channel.ts` — dev, só loga `[SIMULADO]` (padrão, sem credencial).
- `channels/resend.channel.ts` — e-mail via API HTTP do Resend (fetch, sem SDK).
- `notifications.service.ts` — `onModuleInit` escolhe o canal por `NOTIFICATIONS_CHANNEL` (`log`|`email`); expõe `notify<Evento>()`.
- `templates/*.template.ts` — monta `NotificationMessage` (assunto/html/texto pt-BR).

## Adicionar um EVENTO novo (ex.: recusado, lembrete)

1. Crie `templates/<evento>.template.ts` exportando uma `interface <Evento>Data` e uma função que retorna `NotificationMessage`.
2. Em `NotificationsService`, adicione `async notify<Evento>(data): Promise<void>` que faz `await this.channel.send(template(data))` dentro de try/catch (nunca lança).
3. Dispare a partir do service de domínio, **fire-and-forget e idempotente**:
   - `void this.notifications.notify<Evento>(payload)` — não `await` no caminho da request.
   - só na **transição real** de estado (ex.: em `AppointmentsService.setStatus`, checar `era !== novoStatus`) para não reenviar.
   - envolva a montagem do payload em try/catch e **nunca** propague o erro para o fluxo de negócio.
   - injete `NotificationsService` (e o que precisar, ex.: `TenantsService` p/ o nome da barbearia) e importe `NotificationsModule` no módulo de domínio.

Exemplo de gatilho existente: confirmação em `appointments.service.ts` → `dispatchConfirmacao`.

## Adicionar um CANAL novo (ex.: WhatsApp/SMS)

1. `channels/<x>.channel.ts` implementando `NotificationChannel` (use `phoneTo` + `text`).
2. Em `NotificationsService.onModuleInit`, adicione o ramo de seleção por env.
3. Config por env em `.env.example` (`NOTIFICATIONS_CHANNEL`, chaves do provedor).

### WhatsApp — o que ele exige (custo + burocracia)

- API oficial: Cloud API (Meta, direto — mais barato) ou BSP (Twilio/360dialog/Zenvia — mais fácil, com markup + possível assinatura mensal).
- Precisa de **template "utility" aprovado pela Meta**, verificação da empresa, número dedicado e **opt-in** do cliente. Telefone em **E.164** (`+55…`).
- Custo é **por mensagem** (mais burocracia); e-mail é ~grátis. Por isso o padrão do projeto é e-mail primeiro.

## Lembrete "1h antes" (TODO)

A infra existe; falta um **agendador**. Opções: `@nestjs/schedule` (cron que a cada
X min busca agendamentos `CONFIRMADO` com `dataHora` na janela e ainda não
lembrados) ou **BullMQ** com Redis (já há um container redis na máquina) agendando
um job no momento da confirmação. Marque quais já foram lembrados para não duplicar.

## Config (env)

```bash
NOTIFICATIONS_CHANNEL=log            # ou 'email'
RESEND_API_KEY=                      # quando 'email'
MAIL_FROM=BarberSync <no-reply@seudominio.com>
```

Sem `RESEND_API_KEY` com canal `email`, o service cai no log com aviso (não quebra).
