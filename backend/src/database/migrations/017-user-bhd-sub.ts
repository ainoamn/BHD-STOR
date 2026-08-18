import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Link marketplace users to BHD Identity without touching orders, wallets, or passwords.
 */
export class UserBhdSub0171745800000017 implements MigrationInterface {
  name = 'UserBhdSub0171745800000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "bhd_sub" uuid
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_bhd_sub_uidx"
      ON "users" ("bhd_sub")
      WHERE "bhd_sub" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "users_bhd_sub_uidx"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "bhd_sub"`);
  }
}
