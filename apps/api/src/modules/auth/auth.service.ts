import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthResponse, JwtPayload, UserRole } from '@barbersync/shared';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { User } from '../users/user.entity';
import {
  LoginDto,
  RegisterBarbeariaDto,
  RegisterClienteDto,
} from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly tenants: TenantsService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.senha, user.senhaHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }
    return this.buildAuthResponse(user);
  }

  /** Cadastro do cliente (global, sem tenant vinculado). */
  async registerCliente(dto: RegisterClienteDto): Promise<AuthResponse> {
    await this.assertEmailFree(dto.email);
    const user = await this.users.create({
      nome: dto.nome,
      email: dto.email,
      senhaHash: await bcrypt.hash(dto.senha, 10),
      role: UserRole.CLIENTE,
      tenantId: null,
      telefone: dto.telefone,
    });
    return this.buildAuthResponse(user);
  }

  /** "Cadastre sua barbearia": cria o Tenant e o usuário ADMIN vinculado. */
  async registerBarbearia(dto: RegisterBarbeariaDto): Promise<AuthResponse> {
    await this.assertEmailFree(dto.email);
    const tenant = await this.tenants.create(dto.nomeBarbearia);
    const user = await this.users.create({
      nome: dto.nomeAdmin,
      email: dto.email,
      senhaHash: await bcrypt.hash(dto.senha, 10),
      role: UserRole.ADMIN,
      tenantId: tenant.id,
    });
    return this.buildAuthResponse(user);
  }

  private async assertEmailFree(email: string): Promise<void> {
    if (await this.users.findByEmail(email)) {
      throw new ConflictException('E-mail já cadastrado.');
    }
  }

  private buildAuthResponse(user: User): AuthResponse {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
      email: user.email,
    };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }
}
