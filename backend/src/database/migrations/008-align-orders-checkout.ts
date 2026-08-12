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

    // carts was never created in 001 — ensure base table exists before ALTER
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "carts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "currency" varchar(3) NOT NULL DEFAULT 'OMR',
        "subtotal" decimal(12,3) NOT NULL DEFAULT 0,
        "discount_amount" decimal(12,3) NOT NULL DEFAULT 0,
        "tax_amount" decimal(12,3) NOT NULL DEFAULT 0,
        "shipping_amount" decimal(12,3) NOT NULL DEFAULT 0,
        "total" decimal(12,3) NOT NULL DEFAULT 0,
        "coupon_code" varchar(50),
        "item_count" int NOT NULL DEFAULT 0,
        "session_id" varchar(255),
        "expires_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
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
