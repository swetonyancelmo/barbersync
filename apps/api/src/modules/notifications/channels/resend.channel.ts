import { Logger } from '@nestjs/common';
import { NotificationChannel, NotificationMessage } from './notification-channel';

/**
 * Canal de e-mail via Resend (https://resend.com). Usa a API HTTP direto com
 * fetch — sem SDK/dependência extra. Requer RESEND_API_KEY e um remetente/domínio
 * verificado no Resend (MAIL_FROM).
 */
export class ResendChannel implements NotificationChannel {
  readonly name = 'email(resend)';
  private readonly logger = new Logger('Notifications:resend');

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: NotificationMessage): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.emailTo],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Resend respondeu ${res.status}: ${body}`);
    }
    this.logger.log(`E-mail enviado para ${message.emailTo}`);
  }
}
