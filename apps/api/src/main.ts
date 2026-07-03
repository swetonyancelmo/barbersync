import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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

  app.enableCors({
    origin: [
      config.get<string>('CLIENT_ORIGIN', 'http://localhost:3000'),
      config.get<string>('ADMIN_ORIGIN', 'http://localhost:3001'),
    ],
    credentials: true,
  });

  const port = config.get<number>('PORT', 3333);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`BarberSync API rodando em http://localhost:${port}/api`);
}

bootstrap();
