import { DataSourceOptions } from 'typeorm';

/**
 * Fonte única de verdade da conexão com o Postgres. É usada em três lugares:
 *  - runtime do Nest (config/typeorm.config.ts)
 *  - CLI de migrations (database/data-source.ts)
 *  - seed (database/seed.ts)
 * Manter um só builder evita o clássico "a migration rodou em outro banco".
 *
 * Dois modos de conexão:
 *  - DATABASE_URL (produção — Neon/Render entregam a connection string pronta)
 *  - DB_HOST/DB_PORT/... (dev local, Postgres do docker-compose na 5433)
 */
export type EnvGetter = (key: string) => string | undefined;

/** Getter padrão: process.env (o ConfigModule do Nest também escreve nele). */
export const envGetter: EnvGetter = (key) => process.env[key];

function resolveSsl(get: EnvGetter, url: string | undefined) {
  const explicit = get('DB_SSL');
  if (explicit === 'true') return { rejectUnauthorized: false };
  if (explicit === 'false') return false;
  // Sem DB_SSL declarado: liga SSL sempre que a conexão é por URL remota
  // (Neon exige TLS). rejectUnauthorized:false porque o Render não carrega a
  // CA da Neon no store do Node.
  if (url && !/@(localhost|127\.0\.0\.1)/.test(url)) {
    return { rejectUnauthorized: false };
  }
  return false;
}

export function buildDataSourceOptions(
  get: EnvGetter = envGetter,
): DataSourceOptions {
  const url = get('DATABASE_URL');
  const isProduction = get('NODE_ENV') === 'production';

  // Globs relativos a ESTE arquivo, então funcionam tanto em src/ (ts-node)
  // quanto em dist/ (produção) sem duplicar configuração.
  const entities = [__dirname + '/../**/*.entity{.ts,.js}'];
  const migrations = [__dirname + '/../database/migrations/*{.ts,.js}'];

  // synchronize NUNCA em produção, mesmo que alguém deixe DB_SYNC=true no
  // dashboard por engano — em produção o schema é responsabilidade das migrations.
  const synchronize = !isProduction && get('DB_SYNC') === 'true';

  const base = {
    type: 'postgres' as const,
    entities,
    migrations,
    synchronize,
    logging: get('DB_LOGGING') === 'true',
    ssl: resolveSsl(get, url),
  };

  if (url) {
    return { ...base, url };
  }

  return {
    ...base,
    host: get('DB_HOST') || 'localhost',
    port: Number(get('DB_PORT') || 5432),
    username: get('DB_USER') || 'postgres',
    password: get('DB_PASSWORD') || 'postgres',
    database: get('DB_NAME') || 'barbersync',
  };
}
