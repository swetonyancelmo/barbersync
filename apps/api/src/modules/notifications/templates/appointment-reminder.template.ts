import { NotificationMessage } from '../channels/notification-channel';

export interface AppointmentReminderData {
  clienteNome: string;
  clienteEmail: string;
  clienteTelefone: string | null;
  barbeariaNome: string;
  barbeiroNome: string;
  servicos: string[];
  dataHora: Date;
  valorTotal: number;
}

function brl(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function horaCurta(d: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(d);
}

function dataHoraLonga(d: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** Monta a mensagem de lembrete "1h antes" (assunto, HTML e texto). */
export function appointmentReminderMessage(
  data: AppointmentReminderData,
): NotificationMessage {
  const quando = dataHoraLonga(data.dataHora);
  const hora = horaCurta(data.dataHora);
  const servicos = data.servicos.join(', ');
  const valor = brl(data.valorTotal);
  const primeiroNome = data.clienteNome.split(' ')[0];

  const subject = `Lembrete: seu horário é daqui a pouco — ${data.barbeariaNome}`;

  const text = [
    `Olá, ${primeiroNome}!`,
    ``,
    `Passando para lembrar: seu horário na ${data.barbeariaNome} é daqui a pouco. ✂️`,
    ``,
    `Serviço:  ${servicos}`,
    `Barbeiro: ${data.barbeiroNome}`,
    `Quando:   ${quando}`,
    `Valor:    ${valor}`,
    ``,
    `Até já!`,
    `— ${data.barbeariaNome} via BarberSync`,
  ].join('\n');

  const html = `
  <div style="background:#0e0b07;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;color:#efe7d6">
    <div style="max-width:480px;margin:0 auto;background:#1b1510;border:1px solid #3a2e1f;border-radius:4px;overflow:hidden">
      <div style="height:4px;background:repeating-linear-gradient(115deg,#8a3b33 0 9px,#efe7d6 9px 13px,#c89b4c 13px 22px,#efe7d6 22px 26px)"></div>
      <div style="padding:28px 26px">
        <p style="margin:0 0 4px;color:#9a8e79;font-size:12px;letter-spacing:.08em;text-transform:uppercase">${data.barbeariaNome}</p>
        <h1 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;color:#efe7d6">Seu horário é às ${hora}!</h1>
        <p style="margin:0 0 20px;color:#9a8e79;font-size:15px">Olá, ${primeiroNome} — só lembrando do seu corte daqui a pouco. ✂️</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#9a8e79">Serviço</td><td style="padding:8px 0;text-align:right;color:#efe7d6"><strong>${servicos}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#9a8e79">Barbeiro</td><td style="padding:8px 0;text-align:right;color:#efe7d6"><strong>${data.barbeiroNome}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#9a8e79">Quando</td><td style="padding:8px 0;text-align:right;color:#e7c67e"><strong>${quando}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#9a8e79">Valor</td><td style="padding:8px 0;text-align:right;color:#efe7d6"><strong>${valor}</strong></td></tr>
        </table>

        <p style="margin:22px 0 0;color:#9a8e79;font-size:13px">Se não puder ir, avise a barbearia. Até já!</p>
      </div>
    </div>
    <p style="max-width:480px;margin:14px auto 0;color:#6b6253;font-size:11px;text-align:center">Enviado por BarberSync</p>
  </div>`;

  return {
    emailTo: data.clienteEmail,
    phoneTo: data.clienteTelefone,
    subject,
    html,
    text,
  };
}
