import { MigrationInterface, QueryRunner } from 'typeorm';
import { slugify, slugProblem } from '@barbersync/shared';

/**
 * Link de agendamento por barbearia: tenants.slug (único, NOT NULL).
 * Barbearias existentes ganham um slug derivado do nome — mesma regra do
 * TenantsService.uniqueSlugFrom — antes de a coluna virar obrigatória.
 */
export class TenantSlug1792553215459 implements MigrationInterface {
  name = 'TenantSlug1792553215459';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" ADD "slug" character varying(40)`);

    const tenants: { id: string; nome: string }[] = await queryRunner.query(
      `SELECT "id", "nome" FROM "tenants" ORDER BY "criado_em"`,
    );
    const usados = new Set<string>();
    for (const t of tenants) {
      let base = slugify(t.nome);
      if (slugProblem(base)) base = slugify(`barbearia-${base}`);
      base = base.slice(0, 36).replace(/-+$/g, '');
      let slug = base;
      for (let n = 2; usados.has(slug); n++) slug = `${base}-${n}`;
      usados.add(slug);
      await queryRunner.query(`UPDATE "tenants" SET "slug" = $1 WHERE "id" = $2`, [slug, t.id]);
    }

    await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "slug" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD CONSTRAINT "UQ_2310ecc5cb8be427097154b18fc" UNIQUE ("slug")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP CONSTRAINT "UQ_2310ecc5cb8be427097154b18fc"`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "slug"`);
  }
}
