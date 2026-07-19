import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Repository } from 'typeorm';
import { AppointmentStatus } from '@barbersync/shared';
import { Agendamento } from './agendamento.entity';
import { TenantsService } from '../tenants/tenants.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Lembrete "1h antes": cron que varre agendamentos CONFIRMADO ainda não
 * lembrados com horário na próxima 1h e dispara a notificação.
 *
 * - Janela [now, now+60min] (larga de propósito): se a API ficou fora do ar,
 *   o primeiro tick pega qualquer horário ainda futuro — lembrete atrasado é
 *   melhor que nenhum. Horários já passados nunca entram.
 * - Tick a cada 5min → o cliente recebe entre ~55 e 60min antes.
 * - Cross-tenant de propósito: o cron é global; o tenant vem de cada agendamento.
 */
const LOOKAHEAD_MIN = 60;

@Injectable()
export class AppointmentReminderService {
  private readonly logger = new Logger('AppointmentReminder');

  constructor(
    @InjectRepository(Agendamento)
    private readonly repo: Repository<Agendamento>,
    private readonly tenants: TenantsService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron('*/5 * * * *')
  async run(): Promise<void> {
    const now = new Date();
    const ate = new Date(now.getTime() + LOOKAHEAD_MIN * 60_000);

    const candidatos = await this.repo.find({
      where: {
        status: AppointmentStatus.CONFIRMADO,
        lembreteEnviadoEm: IsNull(),
        dataHora: Between(now, ate),
      },
    });

    for (const agendamento of candidatos) {
      // Claim atômico ANTES de enviar: at-most-once mesmo com ticks sobrepostos
      // ou múltiplas instâncias da API.
      const res = await this.repo
        .createQueryBuilder()
        .update(Agendamento)
        .set({ lembreteEnviadoEm: new Date() })
        .where('id = :id AND lembrete_enviado_em IS NULL', { id: agendamento.id })
        .execute();
      if (res.affected) void this.dispatchLembrete(agendamento);
    }
  }

  private async dispatchLembrete(agendamento: Agendamento): Promise<void> {
    try {
      const tenant = await this.tenants.findById(agendamento.tenantId);
      await this.notifications.notifyAppointmentReminder({
        clienteNome: agendamento.cliente.nome,
        clienteEmail: agendamento.cliente.email,
        clienteTelefone: agendamento.cliente.telefone,
        barbeariaNome: tenant.nome,
        barbeiroNome: agendamento.barbeiro.user.nome,
        servicos: agendamento.servicos.map((s) => s.nome),
        dataHora: agendamento.dataHora,
        valorTotal: Number(agendamento.valorTotal),
      });
    } catch (err) {
      // NotificationsService já engole falha de envio; aqui cobre falha na
      // montagem do payload (ex.: tenant removido). Nunca derrubar o cron.
      this.logger.error(
        `Falha ao montar lembrete do agendamento ${agendamento.id}: ${(err as Error).message}`,
      );
    }
  }
}
