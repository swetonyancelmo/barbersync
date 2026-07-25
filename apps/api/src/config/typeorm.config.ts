import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { buildDataSourceOptions } from './data-source-options';

/**
 * Configuração do TypeORM/PostgreSQL para o runtime do Nest. Delega tudo para
 * buildDataSourceOptions (mesmo builder da CLI de migrations e do seed) —
 * ver comentários lá sobre DATABASE_URL, SSL e synchronize.
 */
export function buildTypeOrmOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  return buildDataSourceOptions((key) => config.get<string>(key));
}
