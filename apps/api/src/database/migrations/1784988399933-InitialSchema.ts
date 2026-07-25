import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Baseline do schema, gerada a partir das entities atuais contra um banco vazio
 * (ver DEPLOY.md). Substitui o DB_SYNC=true em produção.
 */
export class InitialSchema1784988399933 implements MigrationInterface {
    name = 'InitialSchema1784988399933'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // uuid_generate_v4() (usado por todo @PrimaryGeneratedColumn('uuid'))
        // vem da uuid-ossp. Com synchronize o TypeORM criava a extensão sozinho;
        // via migration precisamos ser explícitos. A Neon permite esta extensão.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('CLIENTE', 'BARBEIRO', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid, "nome" character varying NOT NULL, "email" character varying NOT NULL, "senha_hash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL, "telefone" character varying, "criado_em" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "expedientes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "dia_semana" integer NOT NULL, "aberto" boolean NOT NULL DEFAULT true, "blocos" jsonb NOT NULL DEFAULT '[]', CONSTRAINT "PK_a5ea29a2665df2319ecbb8f4408" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ed16acae353c432832a4bcaa4e" ON "expedientes" ("tenant_id", "dia_semana") `);
        await queryRunner.query(`CREATE TABLE "servicos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "nome" character varying NOT NULL, "descricao" character varying, "duracao_min" integer NOT NULL, "preco" numeric(10,2) NOT NULL, CONSTRAINT "PK_91c99670ea2115d2028a48c5e0e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_81a5bfea5756df1d6d786a4781" ON "servicos" ("tenant_id") `);
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying NOT NULL, "criado_em" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "barbeiros" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "especialidade" character varying, "rating" numeric(2,1) NOT NULL DEFAULT '5', "ativo" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_b1fb48ee412d59ef0f29f44e953" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_09e6948293f660c711b050f18e" ON "barbeiros" ("tenant_id") `);
        await queryRunner.query(`CREATE TYPE "public"."agendamentos_status_enum" AS ENUM('PENDENTE', 'CONFIRMADO', 'CONCLUIDO', 'RECUSADO')`);
        await queryRunner.query(`CREATE TABLE "agendamentos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "cliente_id" uuid NOT NULL, "barbeiro_id" uuid NOT NULL, "data_hora" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."agendamentos_status_enum" NOT NULL DEFAULT 'PENDENTE', "valor_total" numeric(10,2) NOT NULL, "duracao_total_min" integer NOT NULL, "lembrete_enviado_em" TIMESTAMP WITH TIME ZONE, "criado_em" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3890b7448ebc7efdfd1d43bf0c7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_85e795b2f97d2f012070453d5e" ON "agendamentos" ("cliente_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_022caaef995f2913c618586b3a" ON "agendamentos" ("tenant_id", "data_hora") `);
        await queryRunner.query(`CREATE TYPE "public"."pagamentos_forma_enum" AS ENUM('PIX', 'CARTAO', 'DINHEIRO')`);
        await queryRunner.query(`CREATE TABLE "pagamentos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "agendamento_id" uuid NOT NULL, "forma" "public"."pagamentos_forma_enum" NOT NULL, "valor" numeric(10,2) NOT NULL, "pago_em" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "REL_317997650c6f33217c672e0f4f" UNIQUE ("agendamento_id"), CONSTRAINT "PK_0127f8bc8386b0e522c7cc5a9fc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3350ed34668ebbe17d4789d647" ON "pagamentos" ("tenant_id") `);
        await queryRunner.query(`CREATE TYPE "public"."fidelidades_tier_enum" AS ENUM('BRONZE', 'PRATA', 'OURO')`);
        await queryRunner.query(`CREATE TABLE "fidelidades" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cliente_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "pontos_atuais" integer NOT NULL DEFAULT '0', "total_gasto_historico" numeric(10,2) NOT NULL DEFAULT '0', "tier" "public"."fidelidades_tier_enum" NOT NULL DEFAULT 'BRONZE', "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dce718594c6dd11ed31de7358f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ce76e86234fe9a862a821b0701" ON "fidelidades" ("cliente_id", "tenant_id") `);
        await queryRunner.query(`CREATE TABLE "agendamento_servicos" ("agendamento_id" uuid NOT NULL, "servico_id" uuid NOT NULL, CONSTRAINT "PK_d12f355824cb9e41f3acdbfa9d3" PRIMARY KEY ("agendamento_id", "servico_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_023558b0c846464149354dc961" ON "agendamento_servicos" ("agendamento_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0209b44d15bd3e61b745a1b503" ON "agendamento_servicos" ("servico_id") `);
        await queryRunner.query(`ALTER TABLE "barbeiros" ADD CONSTRAINT "FK_463b90a3865892856fdae6921af" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agendamentos" ADD CONSTRAINT "FK_85e795b2f97d2f012070453d5ec" FOREIGN KEY ("cliente_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agendamentos" ADD CONSTRAINT "FK_bd0ace93ef8fded87643562cab2" FOREIGN KEY ("barbeiro_id") REFERENCES "barbeiros"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pagamentos" ADD CONSTRAINT "FK_317997650c6f33217c672e0f4f2" FOREIGN KEY ("agendamento_id") REFERENCES "agendamentos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agendamento_servicos" ADD CONSTRAINT "FK_023558b0c846464149354dc9612" FOREIGN KEY ("agendamento_id") REFERENCES "agendamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "agendamento_servicos" ADD CONSTRAINT "FK_0209b44d15bd3e61b745a1b5034" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "agendamento_servicos" DROP CONSTRAINT "FK_0209b44d15bd3e61b745a1b5034"`);
        await queryRunner.query(`ALTER TABLE "agendamento_servicos" DROP CONSTRAINT "FK_023558b0c846464149354dc9612"`);
        await queryRunner.query(`ALTER TABLE "pagamentos" DROP CONSTRAINT "FK_317997650c6f33217c672e0f4f2"`);
        await queryRunner.query(`ALTER TABLE "agendamentos" DROP CONSTRAINT "FK_bd0ace93ef8fded87643562cab2"`);
        await queryRunner.query(`ALTER TABLE "agendamentos" DROP CONSTRAINT "FK_85e795b2f97d2f012070453d5ec"`);
        await queryRunner.query(`ALTER TABLE "barbeiros" DROP CONSTRAINT "FK_463b90a3865892856fdae6921af"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0209b44d15bd3e61b745a1b503"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_023558b0c846464149354dc961"`);
        await queryRunner.query(`DROP TABLE "agendamento_servicos"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ce76e86234fe9a862a821b0701"`);
        await queryRunner.query(`DROP TABLE "fidelidades"`);
        await queryRunner.query(`DROP TYPE "public"."fidelidades_tier_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3350ed34668ebbe17d4789d647"`);
        await queryRunner.query(`DROP TABLE "pagamentos"`);
        await queryRunner.query(`DROP TYPE "public"."pagamentos_forma_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_022caaef995f2913c618586b3a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_85e795b2f97d2f012070453d5e"`);
        await queryRunner.query(`DROP TABLE "agendamentos"`);
        await queryRunner.query(`DROP TYPE "public"."agendamentos_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_09e6948293f660c711b050f18e"`);
        await queryRunner.query(`DROP TABLE "barbeiros"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_81a5bfea5756df1d6d786a4781"`);
        await queryRunner.query(`DROP TABLE "servicos"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ed16acae353c432832a4bcaa4e"`);
        await queryRunner.query(`DROP TABLE "expedientes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
