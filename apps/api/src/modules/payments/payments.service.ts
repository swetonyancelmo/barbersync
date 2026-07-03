import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AppointmentStatus, PaymentMethod } from '@barbersync/shared';
import { Pagamento } from './pagamento.entity';
import { Agendamento } from '../appointments/agendamento.entity';
import { LoyaltyService } from '../loyalty/loyalty.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Pagamento)
    private readonly repo: Repository<Pagamento>,
    @InjectRepository(Agendamento)
    private readonly agendamentos: Repository<Agendamento>,
    private readonly loyalty: LoyaltyService,
  ) {}

  /**
   * Registro MANUAL de pagamento (sem gateway). Marca o agendamento como
   * CONCLUIDO e recalcula a fidelidade do cliente em tempo real.
   */
  async register(
    tenantId: string,
    agendamentoId: string,
    forma: PaymentMethod,
  ): Promise<Pagamento> {
    const agendamento = await this.agendamentos.findOne({
      where: { id: agendamentoId, tenantId },
    });
    if (!agendamento) throw new NotFoundException('Agendamento não encontrado.');

    const jaPago = await this.repo.findOne({ where: { agendamentoId } });
    if (jaPago) throw new BadRequestException('Atendimento já foi pago.');

    const pagamento = await this.repo.save(
      this.repo.create({
        tenantId,
        agendamentoId,
        forma,
        valor: agendamento.valorTotal,
        pagoEm: new Date(),
      }),
    );

    agendamento.status = AppointmentStatus.CONCLUIDO;
    await this.agendamentos.save(agendamento);

    // Fidelidade em tempo real (regra inferida — ver CLAUDE.md §7).
    await this.loyalty.recordSpend(
      agendamento.clienteId,
      tenantId,
      Number(agendamento.valorTotal),
    );

    return pagamento;
  }

  /** Mapa agendamentoId → Pagamento para a lista do Financeiro. */
  async findByAgendamentoIds(ids: string[]): Promise<Map<string, Pagamento>> {
    if (ids.length === 0) return new Map();
    const pagos = await this.repo
      .createQueryBuilder('p')
      .where('p.agendamento_id IN (:...ids)', { ids })
      .getMany();
    return new Map(pagos.map((p) => [p.agendamentoId, p]));
  }

  /** KPIs financeiros do dia (recebido, a receber, ticket médio, atendimentos). */
  async kpisDoDia(tenantId: string, data: string) {
    const dia = new Date(`${data}T00:00:00`);
    const inicio = new Date(dia);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(dia);
    fim.setHours(23, 59, 59, 999);

    const doDia = await this.agendamentos.find({
      where: { tenantId, dataHora: Between(inicio, fim) },
    });
    const ativos = doDia.filter((a) => a.status !== AppointmentStatus.RECUSADO);
    const pagosMap = await this.findByAgendamentoIds(ativos.map((a) => a.id));

    let recebido = 0;
    let aReceber = 0;
    for (const a of ativos) {
      const pago = pagosMap.get(a.id);
      if (pago) recebido += Number(pago.valor);
      else aReceber += Number(a.valorTotal);
    }
    const atendimentos = ativos.length;
    const ticketMedio = atendimentos > 0
      ? (recebido + aReceber) / atendimentos
      : 0;

    return { recebido, aReceber, ticketMedio, atendimentos };
  }
}
