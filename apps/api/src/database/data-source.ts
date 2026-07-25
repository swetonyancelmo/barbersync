/**
 * DataSource dedicado à CLI do TypeORM (migration:generate/run/revert).
 * A CLI não sobe o Nest, então precisa de um DataSource exportado como default
 * e do .env carregado na mão — mas as opções vêm do MESMO builder do runtime.
 *
 * Uso (a partir de apps/api):
 *   npm run migration:generate -- src/database/migrations/NomeDaMigration
 *   npm run migration:run
 *   npm run migration:revert
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { buildDataSourceOptions } from '../config/data-source-options';

// dotenv não sobrescreve variáveis já definidas, então é inofensivo no Render
// (onde as envs vêm do dashboard) e continua servindo o dev local.
dotenv.config();

export default new DataSource({
  ...buildDataSourceOptions(),
  // A CLI nunca deve sincronizar: quem cria/altera schema aqui é a migration.
  synchronize: false,
});
