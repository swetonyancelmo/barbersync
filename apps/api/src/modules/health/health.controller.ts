import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Liveness probe consumida pelo health check do Render (GET /api/health).
 * De propósito NÃO consulta o banco: se a Neon estiver dormindo ou lenta, o
 * Render mataria o deploy inteiro por causa de uma dependência externa. Aqui
 * respondemos "o processo está de pé" — nada mais.
 */
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
