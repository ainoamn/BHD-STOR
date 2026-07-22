import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Align payment_gateways with admin toggle needs (display_order).
 * sandbox_mode / is_active already exist from 001.
 */
export class PaymentGatewaysDisplayOrder0111745300000011 implements MigrationInterface {
  name = 'PaymentGatewaysDisplayOrder0111745300000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payment_gateways"
      ADD COLUMN IF NOT EXISTS "display_order" integer NOT NULL DEFAULT 0
    `);

    // Sensible defaults for known codes
    await queryRunner.query(`
      UPDATE "payment_gateways" SET display_order = CASE code
        WHEN 'cod' THEN 1
        WHEN 'cash_on_delivery' THEN 1
        WHEN 'stripe' THEN 2
        WHEN 'paypal' THEN 3
        WHEN 'thawani' THEN 4
        WHEN 'oman_net' THEN 5
        WHEN 'omannet' THEN 5
        WHEN 'bank_transfer' THEN 6
        ELSE display_order
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payment_gateways"
      DROP COLUMN IF EXISTS "display_order"
    `);
  }
}
