import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '@barbersync/shared';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email: email.toLowerCase() } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user;
  }

  /** Atualiza dados do próprio perfil (nome/telefone). */
  async updateProfile(
    id: string,
    data: { nome?: string; telefone?: string },
  ): Promise<User> {
    const user = await this.findById(id);
    if (data.nome !== undefined) user.nome = data.nome;
    if (data.telefone !== undefined) user.telefone = data.telefone;
    return this.repo.save(user);
  }

  create(data: {
    nome: string;
    email: string;
    senhaHash: string;
    role: UserRole;
    tenantId: string | null;
    telefone?: string | null;
  }): Promise<User> {
    const user = this.repo.create({
      ...data,
      email: data.email.toLowerCase(),
      telefone: data.telefone ?? null,
    });
    return this.repo.save(user);
  }

  /** Lista clientes que possuem agendamento numa barbearia (tela Clientes do admin). */
  async findClientesByTenant(tenantId: string, search?: string): Promise<User[]> {
    const qb = this.repo
      .createQueryBuilder('u')
      .innerJoin('agendamentos', 'a', 'a.cliente_id = u.id AND a.tenant_id = :tenantId', { tenantId })
      .where('u.role = :role', { role: UserRole.CLIENTE })
      .distinct(true);

    if (search) {
      qb.andWhere('(LOWER(u.nome) LIKE :s OR u.telefone LIKE :s)', {
        s: `%${search.toLowerCase()}%`,
      });
    }
    return qb.getMany();
  }
}
