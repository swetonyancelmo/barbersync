import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AppointmentStatus, UserRole } from '@barbersync/shared';
import { Barbeiro } from './barbeiro.entity';
import { User } from '../users/user.entity';
import { Agendamento } from '../appointments/agendamento.entity';
import { CreateBarberDto } from './dto/barber.dto';

@Injectable()
export class BarbersService {
  constructor(
    @InjectRepository(Barbeiro)
    private readonly repo: Repository<Barbeiro>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Agendamento)
    private readonly agendamentos: Repository<Agendamento>,
  ) {}

  findAllByTenant(tenantId: string): Promise<Barbeiro[]> {
    return this.repo.find({ where: { tenantId }, order: { id: 'ASC' } });
  }

  findAtivosByTenant(tenantId: string): Promise<Barbeiro[]> {
    return this.repo.find({ where: { tenantId, ativo: true } });
  }

  async assertInTenant(id: string, tenantId: string): Promise<Barbeiro> {
    const barbeiro = await this.repo.findOne({ where: { id, tenantId } });
    if (!barbeiro) throw new NotFoundException('Barbeiro não encontrado.');
    return barbeiro;
  }

  /** Cria o User (role BARBEIRO, vinculado ao tenant) e o perfil de barbeiro. */
  async create(tenantId: string, dto: CreateBarberDto): Promise<Barbeiro> {
    const existing = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new BadRequestException('E-mail já cadastrado.');

    const user = await this.users.save(
      this.users.create({
        nome: dto.nome,
        email: dto.email.toLowerCase(),
        senhaHash: await bcrypt.hash(dto.senha, 10),
        role: UserRole.BARBEIRO,
        tenantId,
        telefone: dto.telefone ?? null,
      }),
    );

    return this.repo.save(
      this.repo.create({
        userId: user.id,
        tenantId,
        especialidade: dto.especialidade ?? null,
        ativo: true,
      }),
    );
  }

  /**
   * Remove um barbeiro. Bloqueado se houver agendamentos futuros ativos
   * (Pendente/Confirmado) — ver estado a cobrir na tela Equipe (CLAUDE.md §6).
   */
  async remove(id: string, tenantId: string): Promise<void> {
    const barbeiro = await this.assertInTenant(id, tenantId);

    const futuros = await this.agendamentos.count({
      where: {
        barbeiroId: id,
        tenantId,
        dataHora: MoreThanOrEqual(new Date()),
        status: Not(AppointmentStatus.RECUSADO),
      },
    });
    if (futuros > 0) {
      throw new BadRequestException(
        'Não é possível remover: barbeiro possui agendamentos futuros. Reatribua ou conclua antes.',
      );
    }

    barbeiro.ativo = false;
    await this.repo.save(barbeiro);
  }
}
