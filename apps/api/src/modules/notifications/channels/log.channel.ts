import { Logger } from '@nestjs/common';
import { NotificationChannel, NotificationMessage } from './notification-channel';

/**
 * Canal de desenvolvimento: não envia nada de verdade, só loga o que seria
 * enviado. Padrão em dev — funciona sem nenhuma credencial. Troque para o canal
 * de e-mail definindo NOTIFICATIONS_CHANNEL=email + RESEND_API_KEY.
 */
export class LogChannel implements NotificationChannel {
  readonly name = 'log';
  private readonly logger = new Logger('Notifications:log');

  async send(message: NotificationMessage): Promise<void> {
    this.logger.log(
      `[SIMULADO] para=${message.emailTo}${message.phoneTo ? ` / tel=${message.phoneTo}` : ''} | assunto="${message.subject}"\n${message.text}`,
    );
  }
}
