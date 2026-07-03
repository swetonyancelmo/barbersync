import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>,
  ) {}

  create(nome: string): Promise<Tenant> {
    return this.repo.save(this.repo.create({ nome }));
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.repo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Barbearia não encontrada.');
    return tenant;
  }

  /** Valida que o tenant existe (usado ao resolver o tenant de um cliente global). */
  async assertExists(id: string): Promise<void> {
    const count = await this.repo.count({ where: { id } });
    if (count === 0) throw new NotFoundException('Barbearia não encontrada.');
  }

  findAll(): Promise<Tenant[]> {
    return this.repo.find();
  }
}
