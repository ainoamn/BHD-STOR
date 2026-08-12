import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * API keys + audit logs tables, and TOTP enrollment columns on users.
 */
export class ApiKeysAuditLogsTotp0151745600000015 implements MigrationInterface {
  name = 'ApiKeysAuditLogsTotp0151745600000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "api_keys" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "key_hash" varchar(128) NOT NULL,
        "key_mask" varchar(8) NOT NULL,
        "scopes" text NOT NULL DEFAULT 'read',
        "is_active" boolean NOT NULL DEFAULT true,
        "is_revoked" boolean NOT NULL DEFAULT false,
        "revoke_reason" varchar(500),
        "last_used_at" TIMESTAMPTZ,
        "expires_at" TIMESTAMPTZ,
        "created_by" uuid NOT NULL,
        "created_from_ip" varchar(45),
        "created_from_user_agent" text,
        "usage_count" int NOT NULL DEFAULT 0,
        "rate_limit_per_minute" int NOT NULL DEFAULT 100,
        "rate_limit_per_day" int NOT NULL DEFAULT 10000,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_api_keys_key_hash" UNIQUE ("key_hash")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_api_keys_is_active" ON "api_keys" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_api_keys_created_by" ON "api_keys" ("created_by")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_api_keys_expires_at" ON "api_keys" ("expires_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "action" varchar(64) NOT NULL,
        "user_id" uuid,
        "user_email" varchar(255),
        "resource" varchar(500),
        "method" varchar(10),
        "path" text,
        "status_code" int,
        "ip" varchar(45),
        "geo_location" jsonb,
        "user_agent" text,
        "parsed_user_agent" jsonb,
        "risk_level" varchar(32) NOT NULL DEFAULT 'info',
        "risk_score" int NOT NULL DEFAULT 0,
        "response_time" int,
        "details" jsonb,
        "error_message" text,
        "api_key_id" uuid,
        "session_id" varchar(255),
        "request_id" varchar(255),
        "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs" ("action")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id" ON "audit_logs" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_ip" ON "audit_logs" ("ip")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_timestamp" ON "audit_logs" ("timestamp")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_risk_level" ON "audit_logs" ("risk_level")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_status_code" ON "audit_logs" ("status_code")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_action_timestamp" ON "audit_logs" ("action", "timestamp")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_timestamp" ON "audit_logs" ("user_id", "timestamp")`,
    );

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "two_factor_temp_secret" varchar(512),
      ADD COLUMN IF NOT EXISTS "two_factor_backup_hashes" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "two_factor_secret" TYPE varchar(512)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "two_factor_temp_secret",
      DROP COLUMN IF EXISTS "two_factor_backup_hashes"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "api_keys"`);
  }
}
