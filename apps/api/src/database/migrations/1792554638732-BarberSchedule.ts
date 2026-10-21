import { MigrationInterface, QueryRunner } from "typeorm";

export class BarberSchedule1792554638732 implements MigrationInterface {
    name = 'BarberSchedule1792554638732'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "folgas_barbeiro" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "barbeiro_id" uuid NOT NULL, "data" date NOT NULL, "motivo" character varying(80), CONSTRAINT "PK_de105f0840a87f9f15c65d2d711" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_51d91ef738c445962e30ad8b9f" ON "folgas_barbeiro" ("barbeiro_id", "data") `);
        await queryRunner.query(`CREATE TABLE "expedientes_barbeiro" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "barbeiro_id" uuid NOT NULL, "dia_semana" integer NOT NULL, "aberto" boolean NOT NULL DEFAULT true, "blocos" jsonb NOT NULL DEFAULT '[]', CONSTRAINT "PK_8469ed5b3469e4aed65902fef72" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7c86c7adf98db3e954d49df35b" ON "expedientes_barbeiro" ("barbeiro_id", "dia_semana") `);
        await queryRunner.query(`ALTER TABLE "folgas_barbeiro" ADD CONSTRAINT "FK_269cee7390d71c686889279dbb7" FOREIGN KEY ("barbeiro_id") REFERENCES "barbeiros"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expedientes_barbeiro" ADD CONSTRAINT "FK_b34a0cbd0208bfe9164735bad66" FOREIGN KEY ("barbeiro_id") REFERENCES "barbeiros"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expedientes_barbeiro" DROP CONSTRAINT "FK_b34a0cbd0208bfe9164735bad66"`);
        await queryRunner.query(`ALTER TABLE "folgas_barbeiro" DROP CONSTRAINT "FK_269cee7390d71c686889279dbb7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7c86c7adf98db3e954d49df35b"`);
        await queryRunner.query(`DROP TABLE "expedientes_barbeiro"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_51d91ef738c445962e30ad8b9f"`);
        await queryRunner.query(`DROP TABLE "folgas_barbeiro"`);
    }

}
