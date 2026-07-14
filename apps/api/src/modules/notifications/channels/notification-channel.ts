/**
 * Mensagem genérica de notificação. Carrega tanto os campos de e-mail quanto um
 * destino de telefone + corpo em texto — assim o mesmo objeto serve para e-mail
 * agora e para WhatsApp/SMS quando forem adicionados (canal agnóstico).
 */
export interface NotificationMessage {
  emailTo: string;
  phoneTo?: string | null;
  subject: string;
  html: string;
  text: string;
}

/** Contrato de um canal de envio (e-mail, WhatsApp, SMS…). */
export interface NotificationChannel {
  readonly name: string;
  send(message: NotificationMessage): Promise<void>;
}
