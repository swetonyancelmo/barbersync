import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { defaultExpediente, ExpedienteDia } from '@barbersync/shared';
import { Expediente } from './expediente.entity';
import { UpdateScheduleDto } from './dto/schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Expediente)
    private readonly repo: Repository<Expediente>,
  ) {}

  /**
   * Retorna os 7 dias da semana. Se a barbearia ainda não configurou, devolve
   * o expediente padrão (não persiste) para a tela já vir preenchida.
   */
  async getByTenant(tenantId: string): Promise<ExpedienteDia[]> {
    const rows = await this.repo.find({ where: { tenantId } });
    if (rows.length === 0) return defaultExpediente();

    const byDia = new Map(rows.map((r) => [r.diaSemana, r]));
    return defaultExpediente().map((padrao) => {
      const r = byDia.get(padrao.diaSemana);
      return r
        ? { diaSemana: r.diaSemana, aberto: r.aberto, blocos: r.blocos }
        : { diaSemana: padrao.diaSemana, aberto: false, blocos: [] };
    });
  }

  /** Expediente de um dia específico (com fallback para o padrão). */
  async getDia(tenantId: string, diaSemana: number): Promise<ExpedienteDia> {
    const row = await this.repo.findOne({ where: { tenantId, diaSemana } });
    if (row) return { diaSemana: row.diaSemana, aberto: row.aberto, blocos: row.blocos };

    const total = await this.repo.count({ where: { tenantId } });
    if (total > 0) return { diaSemana, aberto: false, blocos: [] };
    return defaultExpediente()[diaSemana];
  }

  /** Substitui a configuração da barbearia (upsert por dia). */
  async update(tenantId: string, dto: UpdateScheduleDto): Promise<ExpedienteDia[]> {
    for (const dia of dto.dias) {
      const existing = await this.repo.findOne({
        where: { tenantId, diaSemana: dia.diaSemana },
      });
      if (existing) {
        existing.aberto = dia.aberto;
        existing.blocos = dia.blocos;
        await this.repo.save(existing);
      } else {
        await this.repo.save(
          this.repo.create({
            tenantId,
            diaSemana: dia.diaSemana,
            aberto: dia.aberto,
            blocos: dia.blocos,
          }),
        );
      }
    }
    return this.getByTenant(tenantId);
  }
}
