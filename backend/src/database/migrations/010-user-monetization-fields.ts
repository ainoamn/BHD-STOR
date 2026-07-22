import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ensure users monetization columns exist for subscription vs commission choice.
 */
export class UserMonetizationFields0101745200000010 implements MigrationInterface {
  name = 'UserMonetizationFields0101745200000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE users_commission_type_enum AS ENUM ('subscription', 'percentage', 'hybrid');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE users_subscription_plan_enum AS ENUM ('free', 'basic', 'premium', 'enterprise');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "commission_type" users_commission_type_enum DEFAULT 'percentage',
      ADD COLUMN IF NOT EXISTS "commission_rate" decimal(5,2) DEFAULT 10.00,
      ADD COLUMN IF NOT EXISTS "subscription_plan" users_subscription_plan_enum DEFAULT 'free',
      ADD COLUMN IF NOT EXISTS "subscription_expires_at" TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "commission_type",
      DROP COLUMN IF EXISTS "commission_rate",
      DROP COLUMN IF EXISTS "subscription_plan",
      DROP COLUMN IF EXISTS "subscription_expires_at"
    `);
  }
}
