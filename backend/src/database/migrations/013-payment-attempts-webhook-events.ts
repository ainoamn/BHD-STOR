import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Payment attempts (idempotency) + webhook event inbox (unique provider event).
 * Audit P0 / Phase 2 foundation — ENGINEERING-SECURITY-AUDIT-2026-08-11 §7.4
 */
export class PaymentAttemptsWebhookEvents0131745400000013 implements MigrationInterface {
  name = 'PaymentAttemptsWebhookEvents0131745400000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_attempts_status_enum" AS ENUM (
          'pending', 'processing', 'requires_action', 'succeeded', 'failed', 'cancelled'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_attempts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "idempotency_key" varchar(128) NOT NULL,
        "gateway" varchar(50) NOT NULL,
        "amount" numeric(12,3) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'OMR',
        "status" "payment_attempts_status_enum" NOT NULL DEFAULT 'pending',
        "gateway_reference" varchar(255),
        "request_hash" varchar(64),
        "result_payload" jsonb,
        "last_error" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_payment_attempts_user_idempotency" UNIQUE ("user_id", "idempotency_key")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_payment_attempts_order" ON "payment_attempts" ("order_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_payment_attempts_gateway_ref" ON "payment_attempts" ("gateway_reference")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_payment_attempts_status" ON "payment_attempts" ("status")`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "webhook_events_status_enum" AS ENUM (
          'received', 'processing', 'processed', 'failed', 'ignored'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "webhook_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "provider" varchar(50) NOT NULL,
        "provider_event_id" varchar(255) NOT NULL,
        "event_type" varchar(100),
        "status" "webhook_events_status_enum" NOT NULL DEFAULT 'received',
        "payload_hash" varchar(64),
        "payload" jsonb,
        "signature_status" varchar(64),
        "attempts" int NOT NULL DEFAULT 0,
        "last_error" text,
        "order_id" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_webhook_events_provider_event" UNIQUE ("provider", "provider_event_id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_webhook_events_status" ON "webhook_events" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_webhook_events_created" ON "webhook_events" ("created_at")`);

    // Help concurrent stock updates & unique order numbers
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_orders_order_number"
      ON "orders" ("order_number")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_orders_order_number"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "webhook_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_attempts"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "webhook_events_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_attempts_status_enum"`);
  }
}
