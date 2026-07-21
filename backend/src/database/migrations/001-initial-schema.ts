import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey, TableUnique } from 'typeorm';

export class InitialSchema001 implements MigrationInterface {
  name = 'InitialSchema001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = queryRunner.connection.options.schema || 'public';

    // =====================================================================
    // ENUM TYPES
    // =====================================================================
    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM ('super_admin', 'admin', 'store_owner', 'customer', 'delivery_agent')
    `);
    await queryRunner.query(`
      CREATE TYPE "user_status" AS ENUM ('active', 'inactive', 'suspended', 'pending_verification')
    `);
    await queryRunner.query(`
      CREATE TYPE "store_status" AS ENUM ('active', 'inactive', 'pending_approval', 'suspended')
    `);
    await queryRunner.query(`
      CREATE TYPE "product_status" AS ENUM ('active', 'inactive', 'out_of_stock', 'draft')
    `);
    await queryRunner.query(`
      CREATE TYPE "order_status" AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_status" AS ENUM ('pending', 'completed', 'failed', 'refunded', 'partially_refunded')
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_method" AS ENUM ('omannet', 'thawani', 'cash_on_delivery', 'bank_transfer')
    `);
    await queryRunner.query(`
      CREATE TYPE "subscription_tier" AS ENUM ('free', 'basic', 'premium', 'enterprise')
    `);
    await queryRunner.query(`
      CREATE TYPE "subscription_status" AS ENUM ('active', 'cancelled', 'expired', 'trial')
    `);

    // =====================================================================
    // CURRENCIES TABLE
    // =====================================================================
    await queryRunner.createTable(
      new Table({
        name: 'currencies',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'code', type: 'varchar', length: '3', isUnique: true, isNullable: false },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'name_ar', type: 'varchar', length: '100', isNullable: true },
          { name: 'symbol', type: 'varchar', length: '10', isNullable: false },
          { name: 'exchange_rate', type: 'decimal', precision: 15, scale: 6, default: '1.000000', isNullable: false },
          { name: 'is_default', type: 'boolean', default: false },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'decimal_places', type: 'int', default: 3 },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // =====================================================================
    // USERS TABLE
    // =====================================================================
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'email', type: 'varchar', length: '255', isUnique: true, isNullable: false },
          { name: 'password', type: 'varchar', length: '255', isNullable: false },
          { name: 'first_name', type: 'varchar', length: '100', isNullable: false },
          { name: 'last_name', type: 'varchar', length: '100', isNullable: false },
          { name: 'first_name_ar', type: 'varchar', length: '100', isNullable: true },
          { name: 'last_name_ar', type: 'varchar', length: '100', isNullable: true },
          { name: 'phone', type: 'varchar', length: '20', isNullable: true },
          { name: 'avatar', type: 'varchar', length: '500', isNullable: true },
          { name: 'role', type: 'enum', enum: ['super_admin', 'admin', 'store_owner', 'customer', 'delivery_agent'], default: "'customer'" },
          { name: 'status', type: 'enum', enum: ['active', 'inactive', 'suspended', 'pending_verification'], default: "'pending_verification'" },
          { name: 'email_verified', type: 'boolean', default: false },
          { name: 'phone_verified', type: 'boolean', default: false },
          { name: 'two_factor_enabled', type: 'boolean', default: false },
          { name: 'two_factor_secret', type: 'varchar', length: '255', isNullable: true },
          { name: 'last_login_at', type: 'timestamp', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // =====================================================================
    // CATEGORIES TABLE
    // =====================================================================
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'name_ar', type: 'varchar', length: '100', isNullable: true },
          { name: 'slug', type: 'varchar', length: '120', isUnique: true, isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'description_ar', type: 'text', isNullable: true },
          { name: 'icon', type: 'varchar', length: '100', isNullable: true },
          { name: 'image', type: 'varchar', length: '500', isNullable: true },
          { name: 'parent_id', type: 'uuid', isNullable: true },
          { name: 'sort_order', type: 'int', default: 0 },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // =====================================================================
    // STORES TABLE
    // =====================================================================
    await queryRunner.createTable(
      new Table({
        name: 'stores',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'owner_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', length: '150', isNullable: false },
          { name: 'name_ar', type: 'varchar', length: '150', isNullable: true },
          { name: 'slug', type: 'varchar', length: '150', isUnique: true, isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'description_ar', type: 'text', isNullable: true },
          { name: 'logo', type: 'varchar', length: '500', isNullable: true },
          { name: 'cover_image', type: 'varchar', length: '500', isNullable: true },
          { name: 'status', type: 'enum', enum: ['active', 'inactive', 'pending_approval', 'suspended'], default: "'pending_approval'" },
          { name: 'email', type: 'varchar', length: '255', isNullable: true },
          { name: 'phone', type: 'varchar', length: '20', isNullable: true },
          { name: 'cr_number', type: 'varchar', length: '50', isNullable: true },
          { name: 'vat_number', type: 'varchar', length: '50', isNullable: true },
          { name: 'address', type: 'text', isNullable: true },
          { name: 'address_ar', type: 'text', isNullable: true },
          { name: 'city', type: 'varchar', length: '50', isNullable: true },
          { name: 'region', type: 'varchar', length: '50', isNullable: true },
          { name: 'country', type: 'varchar', length: '50', default: "'OM'" },
          { name: 'postal_code', type: 'varchar', length: '20', isNullable: true },
          { name: 'latitude', type: 'decimal', precision: 10, scale: 8, isNullable: true },
          { name: 'longitude', type: 'decimal', precision: 11, scale: 8, isNullable: true },
          { name: 'rating', type: 'decimal', precision: 2, scale: 1, default: '0.0' },
          { name: 'rating_count', type: 'int', default: 0 },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // =====================================================================
    // PRODUCTS TABLE
    // =====================================================================
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'store_id', type: 'uuid', isNullable: false },
          { name: 'category_id', type: 'uuid', isNullable: true },
          { name: 'name', type: 'varchar', length: '255', isNullable: false },
          { name: 'name_ar', type: 'varchar', length: '255', isNullable: true },
          { name: 'slug', type: 'varchar', length: '300', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'description_ar', type: 'text', isNullable: true },
          { name: 'sku', type: 'varchar', length: '100', isNullable: true },
          { name: 'barcode', type: 'varchar', length: '100', isNullable: true },
          { name: 'price', type: 'decimal', precision: 12, scale: 3, isNullable: false },
          { name: 'compare_at_price', type: 'decimal', precision: 12, scale: 3, isNullable: true },
          { name: 'cost_price', type: 'decimal', precision: 12, scale: 3, isNullable: true },
          { name: 'currency_code', type: 'varchar', length: '3', default: "'OMR'" },
          { name: 'quantity', type: 'int', default: 0 },
          { name: 'min_order_quantity', type: 'int', default: 1 },
          { name: 'weight', type: 'decimal', precision: 10, scale: 3, isNullable: true },
          { name: 'weight_unit', type: 'varchar', length: '10', default: "'kg'" },
          { name: 'status', type: 'enum', enum: ['active', 'inactive', 'out_of_stock', 'draft'], default: "'draft'" },
          { name: 'is_featured', type: 'boolean', default: false },
          { name: 'images', type: 'jsonb', isNullable: true },
          { name: 'attributes', type: 'jsonb', isNullable: true },
          { name: 'seo_title', type: 'varchar', length: '255', isNullable: true },
          { name: 'seo_description', type: 'text', isNullable: true },
          { name: 'search_vector', type: 'tsvector', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // =====================================================================
    // ORDERS TABLE
    // =====================================================================
    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'order_number', type: 'varchar', length: '50', isUnique: true, isNullable: false },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'store_id', type: 'uuid', isNullable: true },
          { name: 'status', type: 'enum', enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], default: "'pending'" },
          { name: 'subtotal', type: 'decimal', precision: 12, scale: 3, isNullable: false },
          { name: 'discount_amount', type: 'decimal', precision: 12, scale: 3, default: '0.000' },
          { name: 'tax_amount', type: 'decimal', precision: 12, scale: 3, default: '0.000' },
          { name: 'shipping_amount', type: 'decimal', precision: 12, scale: 3, default: '0.000' },
          { name: 'total', type: 'decimal', precision: 12, scale: 3, isNullable: false },
          { name: 'currency_code', type: 'varchar', length: '3', default: "'OMR'" },
          { name: 'coupon_code', type: 'varchar', length: '50', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'shipping_address', type: 'jsonb', isNullable: false },
          { name: 'billing_address', type: 'jsonb', isNullable: true },
          { name: 'tracking_number', type: 'varchar', length: '100', isNullable: true },
          { name: 'shipped_at', type: 'timestamp', isNullable: true },
          { name: 'delivered_at', type: 'timestamp', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // =====================================================================
    // ORDER ITEMS TABLE
    // =====================================================================
    await queryRunner.createTable(
      new Table({
        name: 'order_items',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'order_id', type: 'uuid', isNullable: false },
          { name: 'product_id', type: 'uuid', isNullable: false },
          { name: 'product_name', type: 'varchar', length: '255', isNullable: false },
          { name: 'product_sku', type: 'varchar', length: '100', isNullable: true },
          { name: 'quantity', type: 'int', isNullable: false },
          { name: 'unit_price', type: 'decimal', precision: 12, scale: 3, isNullable: false },
          { name: 'total_price', type: 'decimal', precision: 12, scale: 3, isNullable: false },
          { name: 'discount_amount', type: 'decimal', precision: 12, scale: 3, default: '0.000' },
          { name: 'tax_amount', type: 'decimal', precision: 12, scale: 3, default: '0.000' },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // =====================================================================
    // PAYMENTS TABLE
    // =====================================================================
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'order_id', type: 'uuid', isNullable: false },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'amount', type: 'decimal', precision: 12, scale: 3, isNullable: false },
          { name: 'currency_code', type: 'varchar', length: '3', default: "'OMR'" },
          { name: 'payment_method', type: 'enum', enum: ['omannet', 'thawani', 'cash_on_delivery', 'bank_transfer'], isNullable: false },
          { name: 'status', type: 'enum', enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'], default: "'pending'" },
          { name: 'transaction_id', type: 'varchar', length: '255', isNullable: true },
          { name: 'gateway_response', type: 'jsonb', isNullable: true },
          { name: 'paid_at', type: 'timestamp', isNullable: true },
          { name: 'refunded_at', type: 'timestamp', isNullable: true },
          { name: 'refund_amount', type: 'decimal', precision: 12, scale: 3, isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // =====================================================================
    // SUBSCRIPTION PLANS TABLE
    // =====================================================================
    await queryRunner.createTable(
      new Table({
        name: 'subscription_plans',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'name_ar', type: 'varchar', length: '100', isNullable: true },
          { name: 'tier', type: 'enum', enum: ['free', 'basic', 'premium', 'enterprise'], isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'description_ar', type: 'text', isNullable: true },
          { name: 'price_monthly', type: 'decimal', precision: 12, scale: 3, isNullable: false },
          { name: 'price_yearly', type: 'decimal', precision: 12, scale: 3, isNullable: false },
          { name: 'currency_code', type: 'varchar', length: '3', default: "'OMR'" },
          { name: 'product_limit', type: 'int', default: 0 },
          { name: 'storage_limit_mb', type: 'int', default: 0 },
          { name: 'transaction_fee_percent', type: 'decimal', precision: 5, scale: 2, default: '0.00' },
          { name: 'features', type: 'jsonb', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'sort_order', type: 'int', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // =====================================================================
    // SUBSCRIPTIONS TABLE
    // =====================================================================
    await queryRunner.createTable(
      new Table({
        name: 'subscriptions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'store_id', type: 'uuid', isNullable: false },
          { name: 'plan_id', type: 'uuid', isNullable: false },
          { name: 'status', type: 'enum', enum: ['active', 'cancelled', 'expired', 'trial'], default: "'trial'" },
          { name: 'current_period_start', type: 'timestamp', isNullable: false },
          { name: 'current_period_end', type: 'timestamp', isNullable: false },
          { name: 'trial_ends_at', type: 'timestamp', isNullable: true },
          { name: 'cancelled_at', type: 'timestamp', isNullable: true },
          { name: 'cancellation_reason', type: 'text', isNullable: true },
          { name: 'payment_method_id', type: 'uuid', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // =====================================================================
    // SHIPPING CARRIERS TABLE
    // =====================================================================
    await queryRunner.createTable(
      new Table({
        name: 'shipping_carriers',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'name_ar', type: 'varchar', length: '100', isNullable: true },
          { name: 'code', type: 'varchar', length: '50', isUnique: true, isNullable: false },
          { name: 'api_endpoint', type: 'varchar', length: '500', isNullable: true },
          { name: 'api_key', type: 'varchar', length: '255', isNullable: true },
          { name: 'api_secret', type: 'varchar', length: '255', isNullable: true },
          { name: 'tracking_url_template', type: 'varchar', length: '500', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'supports_cod', type: 'boolean', default: false },
          { name: 'config', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // =====================================================================
    // PAYMENT GATEWAYS TABLE
    // =====================================================================
    await queryRunner.createTable(
      new Table({
        name: 'payment_gateways',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'code', type: 'varchar', length: '50', isUnique: true, isNullable: false },
          { name: 'api_key', type: 'varchar', length: '500', isNullable: true },
          { name: 'api_secret', type: 'varchar', length: '500', isNullable: true },
          { name: 'api_endpoint', type: 'varchar', length: '500', isNullable: true },
          { name: 'webhook_secret', type: 'varchar', length: '500', isNullable: true },
          { name: 'sandbox_mode', type: 'boolean', default: true },
          { name: 'is_active', type: 'boolean', default: false },
          { name: 'supported_methods', type: 'jsonb', isNullable: true },
          { name: 'config', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // =====================================================================
    // REFRESH TOKENS TABLE
    // =====================================================================
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'token', type: 'varchar', length: '500', isNullable: false },
          { name: 'expires_at', type: 'timestamp', isNullable: false },
          { name: 'is_revoked', type: 'boolean', default: false },
          { name: 'revoked_at', type: 'timestamp', isNullable: true },
          { name: 'ip_address', type: 'varchar', length: '45', isNullable: true },
          { name: 'user_agent', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // =====================================================================
    // PASSWORD RESET TOKENS TABLE
    // =====================================================================
    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'token', type: 'varchar', length: '255', isNullable: false },
          { name: 'expires_at', type: 'timestamp', isNullable: false },
          { name: 'is_used', type: 'boolean', default: false },
          { name: 'used_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // =====================================================================
    // INDEXES
    // =====================================================================

    // Users indexes
    await queryRunner.createIndex('users', new TableIndex({ columnNames: ['email'] }));
    await queryRunner.createIndex('users', new TableIndex({ columnNames: ['role'] }));
    await queryRunner.createIndex('users', new TableIndex({ columnNames: ['status'] }));
    await queryRunner.createIndex('users', new TableIndex({ columnNames: ['deleted_at'] }));
    await queryRunner.createIndex('users', new TableIndex({ columnNames: ['phone'] }));

    // Categories indexes
    await queryRunner.createIndex('categories', new TableIndex({ columnNames: ['slug'] }));
    await queryRunner.createIndex('categories', new TableIndex({ columnNames: ['parent_id'] }));
    await queryRunner.createIndex('categories', new TableIndex({ columnNames: ['is_active', 'sort_order'] }));

    // Stores indexes
    await queryRunner.createIndex('stores', new TableIndex({ columnNames: ['owner_id'] }));
    await queryRunner.createIndex('stores', new TableIndex({ columnNames: ['slug'] }));
    await queryRunner.createIndex('stores', new TableIndex({ columnNames: ['status'] }));
    await queryRunner.createIndex('stores', new TableIndex({ columnNames: ['deleted_at'] }));

    // Products indexes
    await queryRunner.createIndex('products', new TableIndex({ columnNames: ['store_id'] }));
    await queryRunner.createIndex('products', new TableIndex({ columnNames: ['category_id'] }));
    await queryRunner.createIndex('products', new TableIndex({ columnNames: ['slug'] }));
    await queryRunner.createIndex('products', new TableIndex({ columnNames: ['status'] }));
    await queryRunner.createIndex('products', new TableIndex({ columnNames: ['is_featured'] }));
    await queryRunner.createIndex('products', new TableIndex({ columnNames: ['deleted_at'] }));
    await queryRunner.createIndex('products', new TableIndex({ columnNames: ['price'] }));

    // Orders indexes
    await queryRunner.createIndex('orders', new TableIndex({ columnNames: ['order_number'] }));
    await queryRunner.createIndex('orders', new TableIndex({ columnNames: ['user_id'] }));
    await queryRunner.createIndex('orders', new TableIndex({ columnNames: ['store_id'] }));
    await queryRunner.createIndex('orders', new TableIndex({ columnNames: ['status'] }));
    await queryRunner.createIndex('orders', new TableIndex({ columnNames: ['created_at'] }));

    // Order items indexes
    await queryRunner.createIndex('order_items', new TableIndex({ columnNames: ['order_id'] }));
    await queryRunner.createIndex('order_items', new TableIndex({ columnNames: ['product_id'] }));

    // Payments indexes
    await queryRunner.createIndex('payments', new TableIndex({ columnNames: ['order_id'] }));
    await queryRunner.createIndex('payments', new TableIndex({ columnNames: ['user_id'] }));
    await queryRunner.createIndex('payments', new TableIndex({ columnNames: ['transaction_id'] }));
    await queryRunner.createIndex('payments', new TableIndex({ columnNames: ['status'] }));

    // Subscriptions indexes
    await queryRunner.createIndex('subscriptions', new TableIndex({ columnNames: ['user_id'] }));
    await queryRunner.createIndex('subscriptions', new TableIndex({ columnNames: ['store_id'] }));
    await queryRunner.createIndex('subscriptions', new TableIndex({ columnNames: ['plan_id'] }));
    await queryRunner.createIndex('subscriptions', new TableIndex({ columnNames: ['status'] }));

    // Refresh tokens indexes
    await queryRunner.createIndex('refresh_tokens', new TableIndex({ columnNames: ['user_id'] }));
    await queryRunner.createIndex('refresh_tokens', new TableIndex({ columnNames: ['token'] }));

    // Password reset tokens indexes
    await queryRunner.createIndex('password_reset_tokens', new TableIndex({ columnNames: ['user_id'] }));
    await queryRunner.createIndex('password_reset_tokens', new TableIndex({ columnNames: ['token'] }));

    // =====================================================================
    // FULL-TEXT SEARCH INDEX
    // =====================================================================
    await queryRunner.query(`
      CREATE INDEX idx_products_search ON products USING GIN (search_vector)
    `);

    // =====================================================================
    // FOREIGN KEYS
    // =====================================================================

    // Categories -> Categories (self-reference)
    await queryRunner.createForeignKey(
      'categories',
      new TableForeignKey({
        columnNames: ['parent_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'SET NULL',
      }),
    );

    // Stores -> Users (owner)
    await queryRunner.createForeignKey(
      'stores',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Products -> Stores
    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        columnNames: ['store_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'stores',
        onDelete: 'CASCADE',
      }),
    );

    // Products -> Categories
    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        columnNames: ['category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'SET NULL',
      }),
    );

    // Orders -> Users
    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    );

    // Orders -> Stores
    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        columnNames: ['store_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'stores',
        onDelete: 'SET NULL',
      }),
    );

    // Order Items -> Orders
    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['order_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'orders',
        onDelete: 'CASCADE',
      }),
    );

    // Order Items -> Products
    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'RESTRICT',
      }),
    );

    // Payments -> Orders
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['order_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'orders',
        onDelete: 'RESTRICT',
      }),
    );

    // Payments -> Users
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    );

    // Subscriptions -> Users
    await queryRunner.createForeignKey(
      'subscriptions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Subscriptions -> Stores
    await queryRunner.createForeignKey(
      'subscriptions',
      new TableForeignKey({
        columnNames: ['store_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'stores',
        onDelete: 'CASCADE',
      }),
    );

    // Subscriptions -> Plans
    await queryRunner.createForeignKey(
      'subscriptions',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'subscription_plans',
        onDelete: 'RESTRICT',
      }),
    );

    // Refresh Tokens -> Users
    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Password Reset Tokens -> Users
    await queryRunner.createForeignKey(
      'password_reset_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // =====================================================================
    // UNIQUE CONSTRAINTS
    // =====================================================================

    // Unique store slug
    await queryRunner.createUniqueConstraint(
      'stores',
      new TableUnique({ columnNames: ['slug'] }),
    );

    // Unique product slug per store
    await queryRunner.createUniqueConstraint(
      'products',
      new TableUnique({ columnNames: ['slug', 'store_id'] }),
    );

    // Unique order number
    await queryRunner.createUniqueConstraint(
      'orders',
      new TableUnique({ columnNames: ['order_number'] }),
    );

    // =====================================================================
    // TRIGGERS
    // =====================================================================

    // Auto-update updated_at column for all tables
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    const tablesWithUpdatedAt = [
      'users', 'categories', 'stores', 'products', 'orders',
      'payments', 'subscription_plans', 'subscriptions',
      'shipping_carriers', 'payment_gateways', 'currencies',
    ];

    for (const table of tablesWithUpdatedAt) {
      await queryRunner.query(`
        CREATE TRIGGER update_${table}_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    // Full-text search trigger for products
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_product_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector := 
          setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
          setweight(to_tsvector('simple', COALESCE(NEW.name_ar, '')), 'A') ||
          setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
          setweight(to_tsvector('simple', COALESCE(NEW.sku, '')), 'C');
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_products_search
      BEFORE INSERT OR UPDATE ON products
      FOR EACH ROW
      EXECUTE FUNCTION update_product_search_vector();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_products_search ON products`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_product_search_vector()`);

    const tablesWithUpdatedAt = [
      'currencies', 'payment_gateways', 'shipping_carriers',
      'subscriptions', 'subscription_plans', 'payments',
      'orders', 'products', 'stores', 'categories', 'users',
    ];
    for (const table of tablesWithUpdatedAt) {
      await queryRunner.query(`DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table}`);
    }
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);

    // Drop tables (foreign keys auto-dropped)
    await queryRunner.dropTable('password_reset_tokens', true, true);
    await queryRunner.dropTable('refresh_tokens', true, true);
    await queryRunner.dropTable('subscriptions', true, true);
    await queryRunner.dropTable('subscription_plans', true, true);
    await queryRunner.dropTable('payments', true, true);
    await queryRunner.dropTable('order_items', true, true);
    await queryRunner.dropTable('orders', true, true);
    await queryRunner.dropTable('products', true, true);
    await queryRunner.dropTable('stores', true, true);
    await queryRunner.dropTable('categories', true, true);
    await queryRunner.dropTable('users', true, true);
    await queryRunner.dropTable('currencies', true, true);
    await queryRunner.dropTable('payment_gateways', true, true);
    await queryRunner.dropTable('shipping_carriers', true, true);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS store_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS product_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS order_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_method`);
    await queryRunner.query(`DROP TYPE IF EXISTS subscription_tier`);
    await queryRunner.query(`DROP TYPE IF EXISTS subscription_status`);
  }
}
