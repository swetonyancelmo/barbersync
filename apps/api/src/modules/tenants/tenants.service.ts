import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BarbeariaRef, slugify, slugProblem } from '@barbersync/shared';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>,
  ) {}

  async create(nome: string): Promise<Tenant> {
    const slug = await this.uniqueSlugFrom(nome);
    return this.repo.save(this.repo.create({ nome, slug }));
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.repo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Barbearia não encontrada.');
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.repo.findOne({ where: { slug: slug.toLowerCase() } });
    if (!tenant) throw new NotFoundException('Barbearia não encontrada.');
    return tenant;
  }

  /** Valida que o tenant existe (usado ao resolver o tenant de um cliente global). */
  async assertExists(id: string): Promise<void> {
    const count = await this.repo.count({ where: { id } });
    if (count === 0) throw new NotFoundException('Barbearia não encontrada.');
  }

  /** Barbearias em que o cliente já agendou — o "minhas barbearias" do app. */
  findByCliente(clienteId: string): Promise<BarbeariaRef[]> {
    return this.repo
      .createQueryBuilder('t')
      .select(['t.id AS id', 't.nome AS nome', 't.slug AS slug'])
      .where(
        'EXISTS (SELECT 1 FROM agendamentos a WHERE a.tenant_id = t.id AND a.cliente_id = :clienteId)',
        { clienteId },
      )
      .orderBy('t.nome', 'ASC')
      .getRawMany<BarbeariaRef>();
  }

  /** Troca o endereço do link. Links antigos param de funcionar (sem redirect). */
  async updateSlug(id: string, slugPedido: string): Promise<Tenant> {
    const slug = slugPedido.trim().toLowerCase();
    const problema = slugProblem(slug);
    if (problema) throw new BadRequestException(problema);

    const tenant = await this.findById(id);
    if (tenant.slug === slug) return tenant;
    if (await this.repo.exists({ where: { slug } })) {
      throw new ConflictException('Esse endereço já está em uso por outra barbearia.');
    }
    tenant.slug = slug;
    return this.repo.save(tenant);
  }

  /**
   * Slug livre derivado do nome: "barbearia-do-ze", depois "-2", "-3"…
   * Nomes curtos/reservados ganham o prefixo "barbearia-".
   */
  private async uniqueSlugFrom(nome: string): Promise<string> {
    let base = slugify(nome);
    if (slugProblem(base)) base = slugify(`barbearia-${base}`);
    base = base.slice(0, 36).replace(/-+$/g, '');

    for (let n = 1; ; n++) {
      const candidato = n === 1 ? base : `${base}-${n}`;
      if (!(await this.repo.exists({ where: { slug: candidato } }))) return candidato;
    }
  }
}
