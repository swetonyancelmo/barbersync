import { Controller, Get } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  /**
   * Lista de barbearias para o cliente escolher onde agendar.
   * Retorna apenas id + nome (não expõe dados operacionais de outro tenant).
   */
  @Get()
  async list() {
    const all = await this.tenants.findAll();
    return all.map((t) => ({ id: t.id, nome: t.nome }));
  }
}
