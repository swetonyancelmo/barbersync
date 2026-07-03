import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Servico } from './servico.entity';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Servico)
    private readonly repo: Repository<Servico>,
  ) {}

  findAllByTenant(tenantId: string): Promise<Servico[]> {
    return this.repo.find({ where: { tenantId }, order: { nome: 'ASC' } });
  }

  /** Busca serviços por ids garantindo que TODOS pertencem ao tenant. */
  async findByIdsInTenant(ids: string[], tenantId: string): Promise<Servico[]> {
    const servicos = await this.repo.find({ where: { id: In(ids), tenantId } });
    if (servicos.length !== ids.length) {
      throw new NotFoundException('Um ou mais serviços não existem nesta barbearia.');
    }
    return servicos;
  }

  create(tenantId: string, dto: CreateServiceDto): Promise<Servico> {
    return this.repo.save(this.repo.create({ ...dto, tenantId }));
  }

  async update(id: string, tenantId: string, dto: UpdateServiceDto): Promise<Servico> {
    const servico = await this.repo.findOne({ where: { id, tenantId } });
    if (!servico) throw new NotFoundException('Serviço não encontrado.');
    Object.assign(servico, dto);
    return this.repo.save(servico);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.repo.delete({ id, tenantId });
    if (!result.affected) throw new NotFoundException('Serviço não encontrado.');
  }
}
