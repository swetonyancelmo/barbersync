import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');

  // Valida e transforma todo DTO de entrada; remove propriedades não declaradas
  // (defesa contra o client injetar campos como tenant_id no body).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Allowlist de origins. Em produção use CORS_ORIGINS (lista separada por
  // vírgula com as URLs da Vercel); em dev, CLIENT_ORIGIN/ADMIN_ORIGIN seguem
  // valendo (também aceitam lista, ex.: localhost + IP da LAN p/ testar no
  // celular). Nunca usar origin:'*' — a API responde com credentials:true.
  const origins = [
    config.get<string>('CORS_ORIGINS', ''),
    config.get<string>('CLIENT_ORIGIN', 'http://localhost:3000'),
    config.get<string>('ADMIN_ORIGIN', 'http://localhost:3001'),
  ]
    .flatMap((v) => v.split(','))
    .map((v) => v.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const logger = new Logger('Bootstrap');

  app.enableCors({
    // Callback em vez de array por dois motivos: deixar passar requisições sem
    // header Origin (health check do Render, curl, apps nativos) sem abrir a
    // allowlist, e recusar com `false` em vez de lançar — lançar viraria 500 e
    // encheria o log do Render a cada scanner que bate na API. Sem o header
    // Access-Control-Allow-Origin o navegador bloqueia do mesmo jeito.
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || origins.includes(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }
      logger.warn(`Origin recusada pelo CORS: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  });

  const port = config.get<number>('PORT', 3333);
  // 0.0.0.0 explícito: o Render só considera o serviço saudável se ele escutar
  // em todas as interfaces, não só no loopback.
  await app.listen(port, '0.0.0.0');
  logger.log(`BarberSync API rodando na porta ${port} (prefixo /api)`);
  logger.log(`CORS liberado para: ${origins.join(', ') || '(nenhuma origin)'}`);
}

bootstrap();
