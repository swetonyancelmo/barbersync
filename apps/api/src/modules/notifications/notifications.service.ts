import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel } from './channels/notification-channel';
import { LogChannel } from './channels/log.channel';
import { ResendChannel } from './channels/resend.channel';
import {
  AppointmentConfirmedData,
  appointmentConfirmedMessage,
} from './templates/appointment-confirmed.template';
import {
  AppointmentReminderData,
  appointmentReminderMessage,
} from './templates/appointment-reminder.template';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger('Notifications');
  private channel: NotificationChannel = new LogChannel();

  constructor(private readonly config: ConfigService) {}

  /**
   * Escolhe o canal ativo a partir do ambiente:
   *  - NOTIFICATIONS_CHANNEL=log (padrão) → só loga, sem enviar.
   *  - NOTIFICATIONS_CHANNEL=email        → Resend (exige RESEND_API_KEY + MAIL_FROM).
   * Se pedir email sem credencial, cai no log com aviso (não quebra a app).
   */
  onModuleInit(): void {
    const kind = this.config.get<string>('NOTIFICATIONS_CHANNEL', 'log');
    if (kind === 'email') {
      const apiKey = this.config.get<string>('RESEND_API_KEY');
      const from = this.config.get<string>('MAIL_FROM', 'BarberSync <no-reply@barbersync.app>');
      if (apiKey) {
        this.channel = new ResendChannel(apiKey, from);
      } else {
        this.logger.warn('NOTIFICATIONS_CHANNEL=email sem RESEND_API_KEY — usando canal log.');
      }
    }
    this.logger.log(`Canal de notificação ativo: ${this.channel.name}`);
  }

  /**
   * Notifica o cliente que o agendamento foi confirmado. Fire-and-forget: nunca
   * lança — uma falha de envio não deve derrubar a confirmação do agendamento.
   */
  async notifyAppointmentConfirmed(data: AppointmentConfirmedData): Promise<void> {
    try {
      await this.channel.send(appointmentConfirmedMessage(data));
    } catch (err) {
      this.logger.error(
        `Falha ao notificar confirmação para ${data.clienteEmail}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Lembrete "1h antes" do horário. Mesmo contrato do confirmado: fire-and-forget,
   * nunca lança — uma falha de envio não pode derrubar o cron.
   */
  async notifyAppointmentReminder(data: AppointmentReminderData): Promise<void> {
    try {
      await this.channel.send(appointmentReminderMessage(data));
    } catch (err) {
      this.logger.error(
        `Falha ao enviar lembrete para ${data.clienteEmail}: ${(err as Error).message}`,
      );
    }
  }
}
