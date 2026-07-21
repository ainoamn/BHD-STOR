import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey, TableCheck } from 'typeorm';

export class LogisticsSchema005 implements MigrationInterface {
  public readonly name = 'LogisticsSchema005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = queryRunner.connection.options.type === 'postgres' ? 'public' : undefined;

    // ───────────────────────────────────────────────
    // 1. ZONES
    // ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'zones',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'name_ar', type: 'varchar', length: '100', isNullable: false },
          { name: 'name_en', type: 'varchar', length: '100', isNullable: false },
          { name: 'code', type: 'varchar', length: '10', isNullable: false, isUnique: true },
          { name: 'parent_zone_id', type: 'uuid', isNullable: true },
          { name: 'bounds', type: 'jsonb', isNullable: true, comment: 'GeoJSON polygon of zone boundaries' },
          { name: 'center_lat', type: 'decimal', precision: 10, scale: 8, isNullable: true },
          { name: 'center_lng', type: 'decimal', precision: 11, scale: 8, isNullable: true },
          { name: 'is_active', type: 'boolean', default: true, isNullable: false },
          { name: 'delivery_days', type: 'jsonb', isNullable: true, default: "'[1,2,3,4,5,6]'::jsonb", comment: 'Days of week with delivery (0=Sun)' },
          { name: 'same_day_available', type: 'boolean', default: false, isNullable: false },
          { name: 'cutoff_hour', type: 'int', isNullable: true, default: 12, comment: 'Same-day cutoff hour' },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['parent_zone_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'zones',
            onDelete: 'SET NULL',
            name: 'FK_zones_parent_zone',
          }),
        ],
      }),
      true,
    );

    // ───────────────────────────────────────────────
    // 2. HUBS
    // ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'hubs',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'name_ar', type: 'varchar', length: '150', isNullable: false },
          { name: 'name_en', type: 'varchar', length: '150', isNullable: false },
          { name: 'code', type: 'varchar', length: '10', isNullable: false, isUnique: true },
          { name: 'zone_id', type: 'uuid', isNullable: false },
          { name: 'address', type: 'text', isNullable: false },
          { name: 'latitude', type: 'decimal', precision: 10, scale: 8, isNullable: false },
          { name: 'longitude', type: 'decimal', precision: 11, scale: 8, isNullable: false },
          { name: 'manager_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'manager_phone', type: 'varchar', length: '20', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true, isNullable: false },
          { name: 'operating_hours', type: 'jsonb', isNullable: true, comment: '{open:"08:00",close:"20:00",days:[1,2,3,4,5,6]}' },
          { name: 'capacity_daily', type: 'int', isNullable: true, default: 500 },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['zone_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'zones',
            onDelete: 'RESTRICT',
            name: 'FK_hubs_zone',
          }),
        ],
      }),
      true,
    );

    // ───────────────────────────────────────────────
    // 3. VEHICLES
    // ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'vehicles',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'plate_number', type: 'varchar', length: '20', isNullable: false, isUnique: true },
          { name: 'plate_code', type: 'varchar', length: '10', isNullable: false },
          { name: 'make', type: 'varchar', length: '50', isNullable: false },
          { name: 'model', type: 'varchar', length: '50', isNullable: false },
          { name: 'year', type: 'int', isNullable: false },
          { name: 'type', type: 'enum', enum: ['motorcycle', 'pickup', 'van', 'truck_1t', 'truck_3t', 'truck_5t', 'truck_10t', 'refrigerated', 'flatbed', 'tanker'], isNullable: false },
          { name: 'capacity_kg', type: 'decimal', precision: 8, scale: 2, isNullable: false },
          { name: 'capacity_cbm', type: 'decimal', precision: 6, scale: 2, isNullable: true },
          { name: 'fuel_type', type: 'enum', enum: ['diesel', 'petrol', 'electric', 'hybrid'], default: 'diesel', isNullable: false },
          { name: 'current_hub_id', type: 'uuid', isNullable: true },
          { name: 'status', type: 'enum', enum: ['available', 'in_use', 'maintenance', 'retired'], default: 'available', isNullable: false },
          { name: 'gps_device_id', type: 'varchar', length: '50', isNullable: true },
          { name: 'last_latitude', type: 'decimal', precision: 10, scale: 8, isNullable: true },
          { name: 'last_longitude', type: 'decimal', precision: 11, scale: 8, isNullable: true },
          { name: 'last_location_at', type: 'timestamptz', isNullable: true },
          { name: 'odometer_km', type: 'decimal', precision: 10, scale: 2, default: '0', isNullable: false },
          { name: 'next_service_km', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'insurance_expiry', type: 'date', isNullable: true },
          { name: 'registration_expiry', type: 'date', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true, isNullable: false },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['current_hub_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'hubs',
            onDelete: 'SET NULL',
            name: 'FK_vehicles_hub',
          }),
        ],
      }),
      true,
    );

    // ───────────────────────────────────────────────
    // 4. DRIVERS
    // ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'drivers',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid', isNullable: true, comment: 'Link to auth users table' },
          { name: 'first_name', type: 'varchar', length: '50', isNullable: false },
          { name: 'last_name', type: 'varchar', length: '50', isNullable: false },
          { name: 'full_name', type: 'varchar', length: '120', isNullable: false },
          { name: 'phone', type: 'varchar', length: '20', isNullable: false, isUnique: true },
          { name: 'email', type: 'varchar', length: '100', isNullable: true },
          { name: 'civil_id', type: 'varchar', length: '20', isNullable: false, isUnique: true, comment: 'Omani civil ID' },
          { name: 'license_number', type: 'varchar', length: '30', isNullable: false, isUnique: true },
          { name: 'license_type', type: 'enum', enum: ['light', 'heavy', 'motorcycle', 'commercial'], isNullable: false },
          { name: 'license_expiry', type: 'date', isNullable: false },
          { name: 'assigned_vehicle_id', type: 'uuid', isNullable: true },
          { name: 'home_hub_id', type: 'uuid', isNullable: true },
          { name: 'preferred_zone_id', type: 'uuid', isNullable: true },
          { name: 'status', type: 'enum', enum: ['active', 'offline', 'on_delivery', 'on_leave', 'suspended', 'terminated'], default: 'offline', isNullable: false },
          { name: 'employment_type', type: 'enum', enum: ['full_time', 'part_time', 'contractor'], default: 'full_time', isNullable: false },
          { name: 'rating', type: 'decimal', precision: 3, scale: 2, default: '5.00', isNullable: false },
          { name: 'total_deliveries', type: 'int', default: '0', isNullable: false },
          { name: 'total_earnings', type: 'decimal', precision: 12, scale: 3, default: '0', isNullable: false },
          { name: 'current_latitude', type: 'decimal', precision: 10, scale: 8, isNullable: true },
          { name: 'current_longitude', type: 'decimal', precision: 11, scale: 8, isNullable: true },
          { name: 'location_updated_at', type: 'timestamptz', isNullable: true },
          { name: 'last_login_at', type: 'timestamptz', isNullable: true },
          { name: 'date_of_birth', type: 'date', isNullable: true },
          { name: 'emergency_contact_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'emergency_contact_phone', type: 'varchar', length: '20', isNullable: true },
          { name: 'profile_image_url', type: 'varchar', length: '255', isNullable: true },
          { name: 'documents', type: 'jsonb', isNullable: true, comment: 'Array of uploaded document URLs' },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true, isNullable: false },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['assigned_vehicle_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'vehicles',
            onDelete: 'SET NULL',
            name: 'FK_drivers_vehicle',
          }),
          new TableForeignKey({
            columnNames: ['home_hub_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'hubs',
            onDelete: 'SET NULL',
            name: 'FK_drivers_hub',
          }),
          new TableForeignKey({
            columnNames: ['preferred_zone_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'zones',
            onDelete: 'SET NULL',
            name: 'FK_drivers_zone',
          }),
        ],
      }),
      true,
    );

    // ───────────────────────────────────────────────
    // 5. PRICING RULES
    // ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'pricing_rules',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'zone_from_id', type: 'uuid', isNullable: false },
          { name: 'zone_to_id', type: 'uuid', isNullable: false },
          { name: 'service_type', type: 'enum', enum: ['standard', 'express', 'same_day', 'next_day', 'economy', 'cold_chain', 'heavy_cargo'], default: 'standard', isNullable: false },
          { name: 'base_price', type: 'decimal', precision: 10, scale: 3, isNullable: false },
          { name: 'price_per_kg', type: 'decimal', precision: 10, scale: 3, default: '0', isNullable: false },
          { name: 'price_per_km', type: 'decimal', precision: 10, scale: 3, default: '0', isNullable: false },
          { name: 'min_weight_kg', type: 'decimal', precision: 8, scale: 2, isNullable: true },
          { name: 'max_weight_kg', type: 'decimal', precision: 8, scale: 2, isNullable: true },
          { name: 'min_charge', type: 'decimal', precision: 10, scale: 3, isNullable: true },
          { name: 'max_charge', type: 'decimal', precision: 10, scale: 3, isNullable: true },
          { name: 'fuel_surcharge_pct', type: 'decimal', precision: 5, scale: 2, default: '0', isNullable: false },
          { name: 'vat_included', type: 'boolean', default: true, isNullable: false },
          { name: 'vat_rate', type: 'decimal', precision: 5, scale: 2, default: '5.00', isNullable: false },
          { name: 'priority', type: 'int', default: '0', isNullable: false },
          { name: 'is_active', type: 'boolean', default: true, isNullable: false },
          { name: 'valid_from', type: 'date', isNullable: true },
          { name: 'valid_until', type: 'date', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['zone_from_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'zones',
            onDelete: 'CASCADE',
            name: 'FK_pricing_zone_from',
          }),
          new TableForeignKey({
            columnNames: ['zone_to_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'zones',
            onDelete: 'CASCADE',
            name: 'FK_pricing_zone_to',
          }),
        ],
      }),
      true,
    );

    // ───────────────────────────────────────────────
    // 6. LOGISTICS SHIPMENTS
    // ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'logistics_shipments',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'tracking_number', type: 'varchar', length: '30', isNullable: false, isUnique: true },
          { name: 'order_id', type: 'uuid', isNullable: true, comment: 'Reference to marketplace order' },
          { name: 'external_order_id', type: 'varchar', length: '50', isNullable: true, comment: 'External system order ID' },
          { name: 'shipment_type', type: 'enum', enum: ['b2c', 'b2b', 'c2c', 'return', 'exchange', 'warehouse_transfer'], default: 'b2c', isNullable: false },
          { name: 'service_type', type: 'enum', enum: ['standard', 'express', 'same_day', 'next_day', 'economy', 'cold_chain', 'heavy_cargo'], default: 'standard', isNullable: false },
          { name: 'status', type: 'enum', enum: ['draft', 'pending', 'confirmed', 'picked_up', 'in_transit', 'at_hub', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned', 'cancelled', 'on_hold'], default: 'draft', isNullable: false },
          { name: 'payment_status', type: 'enum', enum: ['pending', 'paid', 'cod', 'failed', 'refunded'], default: 'pending', isNullable: false },
          { name: 'sender_name', type: 'varchar', length: '120', isNullable: false },
          { name: 'sender_phone', type: 'varchar', length: '20', isNullable: false },
          { name: 'sender_email', type: 'varchar', length: '100', isNullable: true },
          { name: 'sender_address', type: 'text', isNullable: false },
          { name: 'sender_lat', type: 'decimal', precision: 10, scale: 8, isNullable: true },
          { name: 'sender_lng', type: 'decimal', precision: 11, scale: 8, isNullable: true },
          { name: 'sender_zone_id', type: 'uuid', isNullable: true },
          { name: 'recipient_name', type: 'varchar', length: '120', isNullable: false },
          { name: 'recipient_phone', type: 'varchar', length: '20', isNullable: false },
          { name: 'recipient_email', type: 'varchar', length: '100', isNullable: true },
          { name: 'recipient_address', type: 'text', isNullable: false },
          { name: 'recipient_lat', type: 'decimal', precision: 10, scale: 8, isNullable: true },
          { name: 'recipient_lng', type: 'decimal', precision: 11, scale: 8, isNullable: true },
          { name: 'recipient_zone_id', type: 'uuid', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'weight_kg', type: 'decimal', precision: 8, scale: 3, isNullable: false },
          { name: 'dimensions_cm', type: 'jsonb', isNullable: true, comment: '{length, width, height}' },
          { name: 'volume_cbm', type: 'decimal', precision: 8, scale: 4, isNullable: true },
          { name: 'pieces', type: 'int', default: '1', isNullable: false },
          { name: 'declared_value', type: 'decimal', precision: 12, scale: 3, isNullable: true },
          { name: 'cod_amount', type: 'decimal', precision: 12, scale: 3, isNullable: true },
          { name: 'is_fragile', type: 'boolean', default: false, isNullable: false },
          { name: 'is_insured', type: 'boolean', default: false, isNullable: false },
          { name: 'insurance_amount', type: 'decimal', precision: 12, scale: 3, isNullable: true },
          { name: 'assigned_driver_id', type: 'uuid', isNullable: true },
          { name: 'assigned_vehicle_id', type: 'uuid', isNullable: true },
          { name: 'current_hub_id', type: 'uuid', isNullable: true },
          { name: 'route_id', type: 'uuid', isNullable: true },
          { name: 'pickup_date', type: 'timestamptz', isNullable: true },
          { name: 'delivery_date', type: 'timestamptz', isNullable: true },
          { name: 'estimated_delivery', type: 'timestamptz', isNullable: true },
          { name: 'actual_delivery', type: 'timestamptz', isNullable: true },
          { name: 'delivery_notes', type: 'text', isNullable: true },
          { name: 'delivery_pod_url', type: 'varchar', length: '255', isNullable: true, comment: 'Proof of delivery image' },
          { name: 'delivery_signature_url', type: 'varchar', length: '255', isNullable: true },
          { name: 'failure_reason', type: 'text', isNullable: true },
          { name: 'failure_attempts', type: 'int', default: '0', isNullable: false },
          { name: 'shipping_cost', type: 'decimal', precision: 10, scale: 3, isNullable: true },
          { name: 'total_charge', type: 'decimal', precision: 10, scale: 3, isNullable: true },
          { name: 'currency', type: 'varchar', length: '3', default: 'OMR', isNullable: false },
          { name: 'label_url', type: 'varchar', length: '255', isNullable: true },
          { name: 'invoice_url', type: 'varchar', length: '255', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['sender_zone_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'zones',
            onDelete: 'SET NULL',
            name: 'FK_shipments_sender_zone',
          }),
          new TableForeignKey({
            columnNames: ['recipient_zone_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'zones',
            onDelete: 'SET NULL',
            name: 'FK_shipments_recipient_zone',
          }),
          new TableForeignKey({
            columnNames: ['assigned_driver_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'drivers',
            onDelete: 'SET NULL',
            name: 'FK_shipments_driver',
          }),
          new TableForeignKey({
            columnNames: ['assigned_vehicle_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'vehicles',
            onDelete: 'SET NULL',
            name: 'FK_shipments_vehicle',
          }),
          new TableForeignKey({
            columnNames: ['current_hub_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'hubs',
            onDelete: 'SET NULL',
            name: 'FK_shipments_hub',
          }),
        ],
      }),
      true,
    );

    // ───────────────────────────────────────────────
    // 7. ROUTES
    // ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'routes',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'route_code', type: 'varchar', length: '20', isNullable: false, isUnique: true },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'hub_id', type: 'uuid', isNullable: false },
          { name: 'driver_id', type: 'uuid', isNullable: true },
          { name: 'vehicle_id', type: 'uuid', isNullable: true },
          { name: 'zone_ids', type: 'jsonb', isNullable: false, comment: 'Ordered array of zone IDs' },
          { name: 'shipment_ids', type: 'jsonb', isNullable: true, comment: 'Ordered array of shipment IDs on route' },
          { name: 'status', type: 'enum', enum: ['planned', 'active', 'completed', 'cancelled'], default: 'planned', isNullable: false },
          { name: 'scheduled_date', type: 'date', isNullable: false },
          { name: 'started_at', type: 'timestamptz', isNullable: true },
          { name: 'completed_at', type: 'timestamptz', isNullable: true },
          { name: 'estimated_distance_km', type: 'decimal', precision: 8, scale: 2, isNullable: true },
          { name: 'actual_distance_km', type: 'decimal', precision: 8, scale: 2, isNullable: true },
          { name: 'estimated_duration_min', type: 'int', isNullable: true },
          { name: 'actual_duration_min', type: 'int', isNullable: true },
          { name: 'fuel_cost', type: 'decimal', precision: 10, scale: 3, isNullable: true },
          { name: 'stops_count', type: 'int', default: '0', isNullable: false },
          { name: 'optimized_path', type: 'jsonb', isNullable: true, comment: 'Optimized waypoint order' },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['hub_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'hubs',
            onDelete: 'CASCADE',
            name: 'FK_routes_hub',
          }),
          new TableForeignKey({
            columnNames: ['driver_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'drivers',
            onDelete: 'SET NULL',
            name: 'FK_routes_driver',
          }),
          new TableForeignKey({
            columnNames: ['vehicle_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'vehicles',
            onDelete: 'SET NULL',
            name: 'FK_routes_vehicle',
          }),
        ],
      }),
      true,
    );

    // ───────────────────────────────────────────────
    // 8. MAINTENANCE RECORDS
    // ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'maintenance_records',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'vehicle_id', type: 'uuid', isNullable: false },
          { name: 'type', type: 'enum', enum: ['routine', 'repair', 'inspection', 'tire_change', 'oil_change', 'brake_service', 'engine_repair', 'body_work', 'electrical', 'other'], isNullable: false },
          { name: 'status', type: 'enum', enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'overdue'], default: 'scheduled', isNullable: false },
          { name: 'description', type: 'text', isNullable: false },
          { name: 'service_provider', type: 'varchar', length: '150', isNullable: true },
          { name: 'cost', type: 'decimal', precision: 10, scale: 3, isNullable: true },
          { name: 'currency', type: 'varchar', length: '3', default: 'OMR', isNullable: false },
          { name: 'odometer_reading', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'parts_replaced', type: 'jsonb', isNullable: true },
          { name: 'labor_hours', type: 'decimal', precision: 5, scale: 2, isNullable: true },
          { name: 'next_service_date', type: 'date', isNullable: true },
          { name: 'next_service_km', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'warranty_months', type: 'int', isNullable: true },
          { name: 'documents', type: 'jsonb', isNullable: true, comment: 'Invoice, photos, etc.' },
          { name: 'scheduled_date', type: 'date', isNullable: true },
          { name: 'completed_date', type: 'date', isNullable: true },
          { name: 'performed_by', type: 'varchar', length: '100', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['vehicle_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'vehicles',
            onDelete: 'CASCADE',
            name: 'FK_maintenance_vehicle',
          }),
        ],
      }),
      true,
    );

    // ───────────────────────────────────────────────
    // 9. B2B CUSTOMERS
    // ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'b2b_customers',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'company_name', type: 'varchar', length: '200', isNullable: false },
          { name: 'trade_name', type: 'varchar', length: '200', isNullable: true },
          { name: 'cr_number', type: 'varchar', length: '30', isNullable: true, comment: 'Commercial Registration' },
          { name: 'tax_number', type: 'varchar', length: '30', isNullable: true },
          { name: 'contact_name', type: 'varchar', length: '120', isNullable: false },
          { name: 'contact_phone', type: 'varchar', length: '20', isNullable: false },
          { name: 'contact_email', type: 'varchar', length: '100', isNullable: false },
          { name: 'billing_address', type: 'text', isNullable: false },
          { name: 'shipping_addresses', type: 'jsonb', isNullable: true },
          { name: 'industry', type: 'varchar', length: '50', isNullable: true },
          { name: 'contract_type', type: 'enum', enum: ['pay_per_shipment', 'monthly', 'quarterly', 'annual'], default: 'pay_per_shipment', isNullable: false },
          { name: 'credit_limit', type: 'decimal', precision: 12, scale: 3, isNullable: true },
          { name: 'credit_used', type: 'decimal', precision: 12, scale: 3, default: '0', isNullable: false },
          { name: 'payment_terms_days', type: 'int', default: '30', isNullable: false },
          { name: 'discount_pct', type: 'decimal', precision: 5, scale: 2, default: '0', isNullable: false },
          { name: 'monthly_volume_commitment', type: 'int', isNullable: true },
          { name: 'account_manager_id', type: 'uuid', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true, isNullable: false },
          { name: 'onboarding_date', type: 'date', isNullable: true },
          { name: 'contract_start', type: 'date', isNullable: true },
          { name: 'contract_end', type: 'date', isNullable: true },
          { name: 'rating', type: 'decimal', precision: 3, scale: 2, default: '5.00', isNullable: false },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
      }),
      true,
    );

    // ───────────────────────────────────────────────
    // 10. DRIVER EARNINGS
    // ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'driver_earnings',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'driver_id', type: 'uuid', isNullable: false },
          { name: 'shipment_id', type: 'uuid', isNullable: true },
          { name: 'earning_type', type: 'enum', enum: ['delivery_fee', 'bonus', 'penalty', 'fuel_allowance', 'overtime', 'incentive', 'tip', 'adjustment'], isNullable: false },
          { name: 'amount', type: 'decimal', precision: 10, scale: 3, isNullable: false },
          { name: 'currency', type: 'varchar', length: '3', default: 'OMR', isNullable: false },
          { name: 'description', type: 'varchar', length: '255', isNullable: true },
          { name: 'status', type: 'enum', enum: ['pending', 'approved', 'paid', 'disputed', 'cancelled'], default: 'pending', isNullable: false },
          { name: 'paid_at', type: 'timestamptz', isNullable: true },
          { name: 'payment_reference', type: 'varchar', length: '50', isNullable: true },
          { name: 'period_start', type: 'date', isNullable: true },
          { name: 'period_end', type: 'date', isNullable: true },
          { name: 'calculated_distance_km', type: 'decimal', precision: 8, scale: 2, isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['driver_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'drivers',
            onDelete: 'CASCADE',
            name: 'FK_earnings_driver',
          }),
          new TableForeignKey({
            columnNames: ['shipment_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'logistics_shipments',
            onDelete: 'SET NULL',
            name: 'FK_earnings_shipment',
          }),
        ],
      }),
      true,
    );

    // ───────────────────────────────────────────────
    // 11. LOCATION HISTORY
    // ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'location_history',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'entity_type', type: 'enum', enum: ['driver', 'vehicle', 'shipment'], isNullable: false },
          { name: 'entity_id', type: 'uuid', isNullable: false },
          { name: 'latitude', type: 'decimal', precision: 10, scale: 8, isNullable: false },
          { name: 'longitude', type: 'decimal', precision: 11, scale: 8, isNullable: false },
          { name: 'accuracy_meters', type: 'decimal', precision: 8, scale: 2, isNullable: true },
          { name: 'altitude', type: 'decimal', precision: 8, scale: 2, isNullable: true },
          { name: 'speed_kmh', type: 'decimal', precision: 6, scale: 2, isNullable: true },
          { name: 'heading', type: 'decimal', precision: 5, scale: 2, isNullable: true },
          { name: 'battery_level', type: 'int', isNullable: true },
          { name: 'recorded_at', type: 'timestamptz', isNullable: false },
          { name: 'source', type: 'enum', enum: ['gps_device', 'mobile_app', 'manual', 'api', 'geocoding'], default: 'mobile_app', isNullable: false },
          { name: 'geofence_zone_id', type: 'uuid', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['geofence_zone_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'zones',
            onDelete: 'SET NULL',
            name: 'FK_location_zone',
          }),
        ],
      }),
      true,
    );

    // ───────────────────────────────────────────────
    // INDEXES
    // ───────────────────────────────────────────────

    // Zones indexes
    await queryRunner.createIndex('zones', new TableIndex({ columnNames: ['code'], name: 'IDX_zones_code' }));
    await queryRunner.createIndex('zones', new TableIndex({ columnNames: ['is_active'], name: 'IDX_zones_active' }));
    await queryRunner.createIndex('zones', new TableIndex({ columnNames: ['center_lat', 'center_lng'], name: 'IDX_zones_center' }));

    // Hubs indexes
    await queryRunner.createIndex('hubs', new TableIndex({ columnNames: ['zone_id'], name: 'IDX_hubs_zone' }));
    await queryRunner.createIndex('hubs', new TableIndex({ columnNames: ['code'], name: 'IDX_hubs_code' }));

    // Vehicles indexes
    await queryRunner.createIndex('vehicles', new TableIndex({ columnNames: ['plate_number'], name: 'IDX_vehicles_plate' }));
    await queryRunner.createIndex('vehicles', new TableIndex({ columnNames: ['status'], name: 'IDX_vehicles_status' }));
    await queryRunner.createIndex('vehicles', new TableIndex({ columnNames: ['type'], name: 'IDX_vehicles_type' }));
    await queryRunner.createIndex('vehicles', new TableIndex({ columnNames: ['current_hub_id'], name: 'IDX_vehicles_hub' }));
    await queryRunner.createIndex('vehicles', new TableIndex({ columnNames: ['last_latitude', 'last_longitude'], name: 'IDX_vehicles_location' }));

    // Drivers indexes
    await queryRunner.createIndex('drivers', new TableIndex({ columnNames: ['phone'], name: 'IDX_drivers_phone' }));
    await queryRunner.createIndex('drivers', new TableIndex({ columnNames: ['civil_id'], name: 'IDX_drivers_civil_id' }));
    await queryRunner.createIndex('drivers', new TableIndex({ columnNames: ['status'], name: 'IDX_drivers_status' }));
    await queryRunner.createIndex('drivers', new TableIndex({ columnNames: ['assigned_vehicle_id'], name: 'IDX_drivers_vehicle' }));
    await queryRunner.createIndex('drivers', new TableIndex({ columnNames: ['home_hub_id'], name: 'IDX_drivers_hub' }));
    await queryRunner.createIndex('drivers', new TableIndex({ columnNames: ['preferred_zone_id'], name: 'IDX_drivers_zone' }));

    // Pricing rules indexes
    await queryRunner.createIndex('pricing_rules', new TableIndex({ columnNames: ['zone_from_id', 'zone_to_id'], name: 'IDX_pricing_zones' }));
    await queryRunner.createIndex('pricing_rules', new TableIndex({ columnNames: ['service_type'], name: 'IDX_pricing_service' }));
    await queryRunner.createIndex('pricing_rules', new TableIndex({ columnNames: ['is_active'], name: 'IDX_pricing_active' }));

    // Shipments indexes
    await queryRunner.createIndex('logistics_shipments', new TableIndex({ columnNames: ['tracking_number'], name: 'IDX_shipments_tracking' }));
    await queryRunner.createIndex('logistics_shipments', new TableIndex({ columnNames: ['order_id'], name: 'IDX_shipments_order' }));
    await queryRunner.createIndex('logistics_shipments', new TableIndex({ columnNames: ['status'], name: 'IDX_shipments_status' }));
    await queryRunner.createIndex('logistics_shipments', new TableIndex({ columnNames: ['service_type'], name: 'IDX_shipments_service' }));
    await queryRunner.createIndex('logistics_shipments', new TableIndex({ columnNames: ['assigned_driver_id'], name: 'IDX_shipments_driver' }));
    await queryRunner.createIndex('logistics_shipments', new TableIndex({ columnNames: ['recipient_zone_id'], name: 'IDX_shipments_zone' }));
    await queryRunner.createIndex('logistics_shipments', new TableIndex({ columnNames: ['created_at'], name: 'IDX_shipments_created' }));
    await queryRunner.createIndex('logistics_shipments', new TableIndex({ columnNames: ['estimated_delivery'], name: 'IDX_shipments_est_delivery' }));

    // Routes indexes
    await queryRunner.createIndex('routes', new TableIndex({ columnNames: ['route_code'], name: 'IDX_routes_code' }));
    await queryRunner.createIndex('routes', new TableIndex({ columnNames: ['status'], name: 'IDX_routes_status' }));
    await queryRunner.createIndex('routes', new TableIndex({ columnNames: ['hub_id'], name: 'IDX_routes_hub' }));
    await queryRunner.createIndex('routes', new TableIndex({ columnNames: ['driver_id'], name: 'IDX_routes_driver' }));
    await queryRunner.createIndex('routes', new TableIndex({ columnNames: ['scheduled_date'], name: 'IDX_routes_date' }));

    // Maintenance indexes
    await queryRunner.createIndex('maintenance_records', new TableIndex({ columnNames: ['vehicle_id'], name: 'IDX_maint_vehicle' }));
    await queryRunner.createIndex('maintenance_records', new TableIndex({ columnNames: ['status'], name: 'IDX_maint_status' }));
    await queryRunner.createIndex('maintenance_records', new TableIndex({ columnNames: ['scheduled_date'], name: 'IDX_maint_scheduled' }));

    // B2B indexes
    await queryRunner.createIndex('b2b_customers', new TableIndex({ columnNames: ['cr_number'], name: 'IDX_b2b_cr' }));
    await queryRunner.createIndex('b2b_customers', new TableIndex({ columnNames: ['is_active'], name: 'IDX_b2b_active' }));

    // Driver earnings indexes
    await queryRunner.createIndex('driver_earnings', new TableIndex({ columnNames: ['driver_id'], name: 'IDX_earnings_driver' }));
    await queryRunner.createIndex('driver_earnings', new TableIndex({ columnNames: ['shipment_id'], name: 'IDX_earnings_shipment' }));
    await queryRunner.createIndex('driver_earnings', new TableIndex({ columnNames: ['status'], name: 'IDX_earnings_status' }));

    // Location history indexes
    await queryRunner.createIndex('location_history', new TableIndex({ columnNames: ['entity_type', 'entity_id'], name: 'IDX_location_entity' }));
    await queryRunner.createIndex('location_history', new TableIndex({ columnNames: ['recorded_at'], name: 'IDX_location_recorded' }));
    await queryRunner.createIndex('location_history', new TableIndex({ columnNames: ['latitude', 'longitude'], name: 'IDX_location_coords' }));

    // ───────────────────────────────────────────────
    // ADD ROUTE_ID FK TO SHIPMENTS (after routes table exists)
    // ───────────────────────────────────────────────
    await queryRunner.createForeignKey(
      'logistics_shipments',
      new TableForeignKey({
        columnNames: ['route_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'routes',
        onDelete: 'SET NULL',
        name: 'FK_shipments_route',
      }),
    );

    // ───────────────────────────────────────────────
    // GIN INDEXES for JSONB columns
    // ───────────────────────────────────────────────
    await queryRunner.query('CREATE INDEX "IDX_zones_bounds_gin" ON zones USING GIN (bounds)');
    await queryRunner.query('CREATE INDEX "IDX_shipments_dimensions_gin" ON logistics_shipments USING GIN (dimensions_cm)');
    await queryRunner.query('CREATE INDEX "IDX_shipments_metadata_gin" ON logistics_shipments USING GIN (metadata)');
    await queryRunner.query('CREATE INDEX "IDX_routes_optimized_gin" ON routes USING GIN (optimized_path)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order to handle FK dependencies
    await queryRunner.dropIndex('location_history', 'IDX_location_coords');
    await queryRunner.dropIndex('location_history', 'IDX_location_recorded');
    await queryRunner.dropIndex('location_history', 'IDX_location_entity');
    await queryRunner.dropTable('location_history', true, true, true);

    await queryRunner.dropIndex('driver_earnings', 'IDX_earnings_status');
    await queryRunner.dropIndex('driver_earnings', 'IDX_earnings_shipment');
    await queryRunner.dropIndex('driver_earnings', 'IDX_earnings_driver');
    await queryRunner.dropTable('driver_earnings', true, true, true);

    await queryRunner.dropIndex('b2b_customers', 'IDX_b2b_active');
    await queryRunner.dropIndex('b2b_customers', 'IDX_b2b_cr');
    await queryRunner.dropTable('b2b_customers', true, true, true);

    await queryRunner.dropIndex('maintenance_records', 'IDX_maint_scheduled');
    await queryRunner.dropIndex('maintenance_records', 'IDX_maint_status');
    await queryRunner.dropIndex('maintenance_records', 'IDX_maint_vehicle');
    await queryRunner.dropTable('maintenance_records', true, true, true);

    await queryRunner.dropIndex('routes', 'IDX_routes_date');
    await queryRunner.dropIndex('routes', 'IDX_routes_driver');
    await queryRunner.dropIndex('routes', 'IDX_routes_hub');
    await queryRunner.dropIndex('routes', 'IDX_routes_status');
    await queryRunner.dropIndex('routes', 'IDX_routes_code');
    await queryRunner.dropTable('routes', true, true, true);

    await queryRunner.dropIndex('logistics_shipments', 'IDX_shipments_est_delivery');
    await queryRunner.dropIndex('logistics_shipments', 'IDX_shipments_created');
    await queryRunner.dropIndex('logistics_shipments', 'IDX_shipments_zone');
    await queryRunner.dropIndex('logistics_shipments', 'IDX_shipments_driver');
    await queryRunner.dropIndex('logistics_shipments', 'IDX_shipments_service');
    await queryRunner.dropIndex('logistics_shipments', 'IDX_shipments_status');
    await queryRunner.dropIndex('logistics_shipments', 'IDX_shipments_order');
    await queryRunner.dropIndex('logistics_shipments', 'IDX_shipments_tracking');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_shipments_metadata_gin"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_shipments_dimensions_gin"');
    await queryRunner.dropTable('logistics_shipments', true, true, true);

    await queryRunner.dropIndex('pricing_rules', 'IDX_pricing_active');
    await queryRunner.dropIndex('pricing_rules', 'IDX_pricing_service');
    await queryRunner.dropIndex('pricing_rules', 'IDX_pricing_zones');
    await queryRunner.dropTable('pricing_rules', true, true, true);

    await queryRunner.dropIndex('drivers', 'IDX_drivers_zone');
    await queryRunner.dropIndex('drivers', 'IDX_drivers_hub');
    await queryRunner.dropIndex('drivers', 'IDX_drivers_vehicle');
    await queryRunner.dropIndex('drivers', 'IDX_drivers_status');
    await queryRunner.dropIndex('drivers', 'IDX_drivers_civil_id');
    await queryRunner.dropIndex('drivers', 'IDX_drivers_phone');
    await queryRunner.dropTable('drivers', true, true, true);

    await queryRunner.dropIndex('vehicles', 'IDX_vehicles_location');
    await queryRunner.dropIndex('vehicles', 'IDX_vehicles_hub');
    await queryRunner.dropIndex('vehicles', 'IDX_vehicles_type');
    await queryRunner.dropIndex('vehicles', 'IDX_vehicles_status');
    await queryRunner.dropIndex('vehicles', 'IDX_vehicles_plate');
    await queryRunner.dropTable('vehicles', true, true, true);

    await queryRunner.dropIndex('hubs', 'IDX_hubs_code');
    await queryRunner.dropIndex('hubs', 'IDX_hubs_zone');
    await queryRunner.dropTable('hubs', true, true, true);

    await queryRunner.dropIndex('zones', 'IDX_zones_center');
    await queryRunner.dropIndex('zones', 'IDX_zones_active');
    await queryRunner.dropIndex('zones', 'IDX_zones_code');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_zones_bounds_gin"');
    await queryRunner.dropTable('zones', true, true, true);
  }
}
