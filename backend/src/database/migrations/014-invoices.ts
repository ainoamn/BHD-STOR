import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tax invoices with yearly sequence (audit P2-03).
 */
export class Invoices0141745500000014 implements MigrationInterface {
  name = 'Invoices0141745500000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "invoices_status_enum" AS ENUM ('issued', 'void');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoice_sequences" (
        "year" int PRIMARY KEY,
        "last_value" int NOT NULL DEFAULT 0
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoices" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoice_number" varchar(32) NOT NULL,
        "year" int NOT NULL,
        "sequence" int NOT NULL,
        "payment_id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "amount" numeric(12,3) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'OMR',
        "status" "invoices_status_enum" NOT NULL DEFAULT 'issued',
        "gateway" varchar(64),
        "issued_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_invoices_invoice_number" UNIQUE ("invoice_number"),
        CONSTRAINT "uq_invoices_payment_id" UNIQUE ("payment_id"),
        CONSTRAINT "uq_invoices_year_sequence" UNIQUE ("year", "sequence")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_invoices_order" ON "invoices" ("order_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_invoices_user" ON "invoices" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_sequences"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoices_status_enum"`);
  }
}
