import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Configuração do TypeORM/PostgreSQL. As entidades são carregadas por glob para
 * evitar imports circulares. `synchronize` só deve ficar ligado em dev (DB_SYNC).
 */
export function buildTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.get<string>('DB_HOST', 'localhost'),
    port: config.get<number>('DB_PORT', 5432),
    username: config.get<string>('DB_USER', 'postgres'),
    password: config.get<string>('DB_PASSWORD', 'postgres'),
    database: config.get<string>('DB_NAME', 'barbersync'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: config.get<string>('DB_SYNC', 'false') === 'true',
    logging: false,
  };
}
