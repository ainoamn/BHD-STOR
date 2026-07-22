import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Align orders / carts columns with commerce checkout flow.
 */
export class AlignOrdersCheckout0081745000000008 implements MigrationInterface {
  name = 'AlignOrdersCheckout0081745000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "payment_status" varchar(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "payment_method" varchar(50),
      ADD COLUMN IF NOT EXISTS "status_history" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD COLUMN IF NOT EXISTS "store_id" uuid,
      ADD COLUMN IF NOT EXISTS "product_image" varchar(500),
      ADD COLUMN IF NOT EXISTS "variant_attributes" jsonb,
      ADD COLUMN IF NOT EXISTS "fulfillment_status" varchar(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "carts"
      ADD COLUMN IF NOT EXISTS "shipping_amount" decimal(12,3) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "tax_amount" decimal(12,3) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "discount_amount" decimal(12,3) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "item_count" int DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "session_id" varchar(255),
      ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "payment_status",
      DROP COLUMN IF EXISTS "payment_method",
      DROP COLUMN IF EXISTS "status_history"
    `);
  }
}
