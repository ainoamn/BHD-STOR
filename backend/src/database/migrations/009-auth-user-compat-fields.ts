import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthUserCompatFields0091745100000009 implements MigrationInterface {
  name = 'AuthUserCompatFields0091745100000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "reset_token" varchar(255),
      ADD COLUMN IF NOT EXISTS "reset_token_expiry" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "email_verification_token" varchar(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "reset_token",
      DROP COLUMN IF EXISTS "reset_token_expiry",
      DROP COLUMN IF EXISTS "email_verification_token"
    `);
  }
}
