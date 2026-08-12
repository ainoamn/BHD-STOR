import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Product merchandising columns used by featured/sales queries.
 */
export class ProductFeaturedSales0161745600000016 implements MigrationInterface {
  name = 'ProductFeaturedSales0161745600000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "is_featured" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "sales_count" int NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_is_featured"
      ON "products" ("is_featured")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_is_featured"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "sales_count"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "is_featured"`);
  }
}
