import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add display_order for shipping carrier admin sorting/toggles.
 */
export class ShippingCarriersDisplayOrder0121745400000012 implements MigrationInterface {
  name = 'ShippingCarriersDisplayOrder0121745400000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "shipping_carriers"
      ADD COLUMN IF NOT EXISTS "display_order" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      UPDATE "shipping_carriers" SET display_order = CASE code
        WHEN 'oman_post' THEN 1
        WHEN 'aramex' THEN 2
        WHEN 'aramex_oman' THEN 2
        WHEN 'dhl' THEN 3
        WHEN 'dhl_oman' THEN 3
        WHEN 'fedex' THEN 4
        WHEN 'ups' THEN 5
        WHEN 'local_delivery_muscat' THEN 6
        ELSE display_order
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "shipping_carriers"
      DROP COLUMN IF EXISTS "display_order"
    `);
  }
}
