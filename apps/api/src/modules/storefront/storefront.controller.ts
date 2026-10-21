import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { IsDateString, IsUUID } from 'class-validator';
import { PublicBarbearia } from '@barbersync/shared';
import { Public } from '../../common/decorators/public.decorator';
import { TenantsService } from '../tenants/tenants.service';
import { ServicesService } from '../services/services.service';
import { BarbersService } from '../barbers/barbers.service';
import { AppointmentsService } from '../appointments/appointments.service';

class PublicAvailabilityQueryDto {
  @IsUUID()
  barbeiroId: string;

  /** Data no formato YYYY-MM-DD. */
  @IsDateString()
  data: string;
}

/**
 * Vitrine pública do link de agendamento (app.barbersync.com/<slug>).
 *
 * Sem JWT: o cliente vê serviços, barbeiros e horários livres ANTES de logar —
 * o login só é pedido para confirmar (POST /appointments continua protegido).
 * O tenant sai do slug resolvido aqui, nunca de um id enviado pelo client, e as
 * respostas são mapeadas campo a campo para não vazar dados internos (e-mail e
 * telefone do barbeiro, ids de usuário, etc.).
 */
@Public()
@Controller('public/barbearias')
export class StorefrontController {
  constructor(
    private readonly tenants: TenantsService,
    private readonly services: ServicesService,
    private readonly barbers: BarbersService,
    private readonly appointments: AppointmentsService,
  ) {}

  @Get(':slug')
  async vitrine(@Param('slug') slug: string): Promise<PublicBarbearia> {
    const tenant = await this.tenants.findBySlug(slug);
    const [servicos, barbeiros] = await Promise.all([
      this.services.findAllByTenant(tenant.id),
      this.barbers.findAtivosByTenant(tenant.id),
    ]);
    return {
      id: tenant.id,
      nome: tenant.nome,
      slug: tenant.slug,
      servicos: servicos.map((s) => ({
        id: s.id,
        nome: s.nome,
        descricao: s.descricao,
        duracaoMin: s.duracaoMin,
        preco: Number(s.preco),
      })),
      barbeiros: barbeiros.map((b) => ({
        id: b.id,
        nome: b.user.nome,
        especialidade: b.especialidade,
        rating: Number(b.rating),
      })),
    };
  }

  @Get(':slug/disponibilidade')
  async disponibilidade(
    @Param('slug') slug: string,
    @Query() q: PublicAvailabilityQueryDto,
  ) {
    const tenant = await this.tenants.findBySlug(slug);
    const barbeiro = await this.barbers.assertInTenant(q.barbeiroId, tenant.id);
    if (!barbeiro.ativo) throw new NotFoundException('Barbeiro não encontrado.');
    return this.appointments.getAvailability(tenant.id, barbeiro.id, q.data);
  }
}
