import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedLogistics006 implements MigrationInterface {
  public readonly name = 'SeedLogistics006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ───────────────────────────────────────────────
    // 1. ZONES (5 governorates)
    // ───────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO zones (id, name_ar, name_en, code, center_lat, center_lng, is_active, same_day_available, cutoff_hour, delivery_days) VALUES
      ('z-muscat-001', 'مسقط', 'Muscat', 'MCT', 23.6139, 58.5423, true, true, 12, '[0,1,2,3,4,5,6]'),
      ('z-salalah-001', 'صلالة', 'Salalah', 'SAL', 17.0194, 54.0897, true, true, 11, '[0,1,2,3,4,5,6]'),
      ('z-sohar-001', 'صحار', 'Sohar', 'SHR', 24.3475, 56.7094, true, false, null, '[0,1,2,3,4,5]'),
      ('z-nizwa-001', 'نزوى', 'Nizwa', 'NZW', 22.9260, 57.5342, true, false, null, '[0,1,2,3,4,5]'),
      ('z-sur-001', 'صور', 'Sur', 'SUR', 22.5667, 59.5289, true, false, null, '[0,1,2,3,4]')
      ON CONFLICT (id) DO NOTHING;
    `);

    // ───────────────────────────────────────────────
    // 2. HUBS (3 hubs)
    // ───────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO hubs (id, name_ar, name_en, code, zone_id, address, latitude, longitude, manager_name, manager_phone, is_active, capacity_daily, operating_hours) VALUES
      ('hub-mct-001', 'المركز الرئيسي مسقط', 'Central Muscat Hub', 'MCT-HQ', 'z-muscat-001', 'السيب، جبل السابق، شارع الوكالات، مقابل مركز السيب التجاري', 23.6100, 58.5400, 'خالد البلوشي', '+968 9123 4567', true, 800,
        '{"open":"07:00","close":"22:00","days":[0,1,2,3,4,5,6]}'),
      ('hub-sal-001', 'مركز صلالة اللوجستي', 'Salalah Logistics Center', 'SAL-LC', 'z-salalah-001', 'صلالة، المنطقة الصناعية، شارع السلام', 17.0150, 54.0850, 'سعيد الهنائي', '+968 9234 5678', true, 400,
        '{"open":"08:00","close":"20:00","days":[0,1,2,3,4,5,6]}'),
      ('hub-shr-001', 'مركز صحار التوزيعي', 'Sohar Distribution Center', 'SHR-DC', 'z-sohar-001', 'صحار، المنطقة الصناعية، شارع الملكة', 24.3450, 56.7050, 'محمد الشبيبي', '+968 9345 6789', true, 350,
        '{"open":"08:00","close":"20:00","days":[0,1,2,3,4,5]}')
      ON CONFLICT (id) DO NOTHING;
    `);

    // ───────────────────────────────────────────────
    // 3. VEHICLES (10 vehicles)
    // ───────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO vehicles (id, plate_number, plate_code, make, model, year, type, capacity_kg, capacity_cbm, fuel_type, current_hub_id, status, odometer_km, next_service_km, insurance_expiry, registration_expiry) VALUES
      ('v-001', '12345', 'A', 'Toyota', 'Hilux', 2023, 'pickup', 1000.00, 3.50, 'diesel', 'hub-mct-001', 'available', 15420.50, 20000.00, '2025-12-15', '2026-03-20'),
      ('v-002', '23456', 'B', 'Toyota', 'Hiace', 2022, 'van', 1500.00, 8.00, 'diesel', 'hub-mct-001', 'available', 28930.00, 30000.00, '2025-11-20', '2026-02-15'),
      ('v-003', '34567', 'A', 'Mitsubishi', 'Canter', 2023, 'truck_3t', 3000.00, 18.00, 'diesel', 'hub-mct-001', 'available', 18750.25, 25000.00, '2026-01-10', '2026-06-30'),
      ('v-004', '45678', 'C', 'Isuzu', 'NPR', 2021, 'truck_5t', 5000.00, 28.00, 'diesel', 'hub-mct-001', 'in_use', 45670.00, 50000.00, '2025-10-05', '2026-01-15'),
      ('v-005', '56789', 'D', 'Yamaha', 'MT-07', 2023, 'motorcycle', 50.00, 0.15, 'petrol', 'hub-mct-001', 'available', 8920.00, 12000.00, '2025-09-30', '2026-04-20'),
      ('v-006', '67890', 'A', 'Toyota', 'Hilux', 2022, 'pickup', 1000.00, 3.50, 'diesel', 'hub-sal-001', 'available', 22150.75, 25000.00, '2025-12-01', '2026-05-10'),
      ('v-007', '78901', 'B', 'Toyota', 'Coaster', 2023, 'van', 2000.00, 12.00, 'diesel', 'hub-sal-001', 'available', 12340.00, 20000.00, '2026-02-28', '2026-08-15'),
      ('v-008', '89012', 'A', 'Hino', '300 Series', 2021, 'truck_3t', 3500.00, 20.00, 'diesel', 'hub-sal-001', 'in_use', 38920.50, 40000.00, '2025-08-15', '2026-01-20'),
      ('v-009', '90123', 'C', 'Mitsubishi', 'Canter', 2022, 'truck_5t', 5000.00, 28.00, 'diesel', 'hub-shr-001', 'available', 27560.00, 30000.00, '2025-11-10', '2026-03-25'),
      ('v-010', '01234', 'D', 'Yamaha', 'FZ-S', 2023, 'motorcycle', 30.00, 0.10, 'petrol', 'hub-shr-001', 'available', 6540.25, 10000.00, '2025-07-20', '2026-06-15')
      ON CONFLICT (id) DO NOTHING;
    `);

    // ───────────────────────────────────────────────
    // 4. DRIVERS (10 drivers)
    // ───────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO drivers (id, first_name, last_name, full_name, phone, email, civil_id, license_number, license_type, license_expiry, assigned_vehicle_id, home_hub_id, preferred_zone_id, status, employment_type, rating, total_deliveries, total_earnings, date_of_birth, emergency_contact_name, emergency_contact_phone) VALUES
      ('d-001', 'أحمد', 'البلوشي', 'أحمد البلوشي', '+968 9012 3456', 'ahmed.balushi@bhd.om', '10123456', 'L-2020-001', 'light', '2026-05-15', 'v-001', 'hub-mct-001', 'z-muscat-001', 'active', 'full_time', 4.80, 1240, 8400.500, '1988-03-10', 'محمد البلوشي', '+968 9012 3457'),
      ('d-002', 'خالد', 'السيابي', 'خالد السيابي', '+968 9123 4567', 'khalid.siyabi@bhd.om', '10234567', 'L-2019-002', 'light', '2027-02-20', 'v-002', 'hub-mct-001', 'z-muscat-001', 'active', 'full_time', 4.90, 1560, 11200.750, '1990-07-22', 'فاطمة السيابية', '+968 9123 4568'),
      ('d-003', 'سالم', 'الحجري', 'سالم الحجري', '+968 9234 5678', 'salem.hajri@bhd.om', '10345678', 'L-2021-003', 'heavy', '2026-08-10', 'v-003', 'hub-mct-001', 'z-muscat-001', 'on_delivery', 'full_time', 4.70, 980, 7800.250, '1985-11-05', 'ناصر الحجري', '+968 9234 5679'),
      ('d-004', 'مبارك', 'الشبيبي', 'مبارك الشبيبي', '+968 9345 6789', 'mubarak.shabibi@bhd.om', '10456789', 'L-2020-004', 'heavy', '2027-01-25', 'v-004', 'hub-mct-001', 'z-muscat-001', 'active', 'full_time', 4.60, 1100, 8900.000, '1987-04-18', 'عائشة الشبيبية', '+968 9345 6790'),
      ('d-005', 'فهد', 'البرطماني', 'فهد البرطماني', '+968 9456 7890', 'fahd.bartamani@bhd.om', '10567890', 'L-2022-005', 'motorcycle', '2026-11-30', 'v-005', 'hub-mct-001', 'z-muscat-001', 'active', 'part_time', 4.95, 2100, 6500.500, '1995-09-12', 'عبدالله البرطماني', '+968 9456 7891'),
      ('d-006', 'سعيد', 'الهنائي', 'سعيد الهنائي', '+968 9567 8901', 'saeed.hinai@bhd.om', '10678901', 'L-2019-006', 'light', '2027-03-15', 'v-006', 'hub-sal-001', 'z-salalah-001', 'active', 'full_time', 4.75, 890, 7200.000, '1989-01-28', 'مريم الهنائية', '+968 9567 8902'),
      ('d-007', 'ناصر', 'الراشدي', 'ناصر الراشدي', '+968 9678 9012', 'nasser.rashdi@bhd.om', '10789012', 'L-2021-007', 'light', '2026-07-20', 'v-007', 'hub-sal-001', 'z-salalah-001', 'offline', 'full_time', 4.85, 720, 6100.250, '1991-06-08', 'حمد الراشدي', '+968 9678 9013'),
      ('d-008', 'يوسف', 'العبري', 'يوسف العبري', '+968 9789 0123', 'yousef.abri@bhd.om', '10890123', 'L-2020-008', 'heavy', '2026-12-05', 'v-008', 'hub-sal-001', 'z-salalah-001', 'active', 'full_time', 4.65, 1050, 8500.750, '1986-12-01', 'سلمى العبرية', '+968 9789 0124'),
      ('d-009', 'عبدالله', 'الغافري', 'عبدالله الغافري', '+968 9890 1234', 'abdullah.ghafri@bhd.om', '10901234', 'L-2022-009', 'heavy', '2027-04-18', 'v-009', 'hub-shr-001', 'z-sohar-001', 'active', 'full_time', 4.70, 650, 5800.500, '1992-08-14', 'مبارك الغافري', '+968 9890 1235'),
      ('d-010', 'هيثم', 'السيابي', 'هيثم السيابي', '+968 9901 2345', 'haitham.siyabi@bhd.om', '11012345', 'L-2023-010', 'motorcycle', '2027-06-22', 'v-010', 'hub-shr-001', 'z-sohar-001', 'active', 'part_time', 4.88, 450, 3200.250, '1996-02-25', 'خالد السيابي', '+968 9901 2346')
      ON CONFLICT (id) DO NOTHING;
    `);

    // ───────────────────────────────────────────────
    // 5. PRICING RULES (20 rules)
    // ───────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO pricing_rules (id, name, zone_from_id, zone_to_id, service_type, base_price, price_per_kg, price_per_km, min_weight_kg, max_weight_kg, min_charge, max_charge, fuel_surcharge_pct, vat_included, priority, is_active) VALUES
      -- Muscat same zone
      ('pr-001', 'Muscat Standard 0-5kg', 'z-muscat-001', 'z-muscat-001', 'standard', 1.500, 0.100, 0.000, 0.00, 5.00, 1.500, 5.000, 0.00, true, 1, true),
      ('pr-002', 'Muscat Standard 5-20kg', 'z-muscat-001', 'z-muscat-001', 'standard', 2.000, 0.150, 0.000, 5.00, 20.00, 2.000, 8.000, 0.00, true, 2, true),
      ('pr-003', 'Muscat Express 0-5kg', 'z-muscat-001', 'z-muscat-001', 'express', 2.500, 0.200, 0.000, 0.00, 5.00, 2.500, 8.000, 0.00, true, 1, true),
      ('pr-004', 'Muscat Same-Day 0-3kg', 'z-muscat-001', 'z-muscat-001', 'same_day', 3.500, 0.250, 0.000, 0.00, 3.00, 3.500, 10.000, 0.00, true, 1, true),
      -- Salalah same zone
      ('pr-005', 'Salalah Standard 0-5kg', 'z-salalah-001', 'z-salalah-001', 'standard', 1.500, 0.100, 0.000, 0.00, 5.00, 1.500, 5.000, 0.00, true, 1, true),
      ('pr-006', 'Salalah Express 0-5kg', 'z-salalah-001', 'z-salalah-001', 'express', 2.500, 0.200, 0.000, 0.00, 5.00, 2.500, 8.000, 0.00, true, 1, true),
      ('pr-007', 'Salalah Same-Day 0-3kg', 'z-salalah-001', 'z-salalah-001', 'same_day', 3.500, 0.250, 0.000, 0.00, 3.00, 3.500, 10.000, 0.00, true, 1, true),
      -- Sohar same zone
      ('pr-008', 'Sohar Standard 0-5kg', 'z-sohar-001', 'z-sohar-001', 'standard', 1.500, 0.100, 0.000, 0.00, 5.00, 1.500, 5.000, 0.00, true, 1, true),
      ('pr-009', 'Sohar Express 0-5kg', 'z-sohar-001', 'z-sohar-001', 'express', 2.500, 0.200, 0.000, 0.00, 5.00, 2.500, 8.000, 0.00, true, 1, true),
      -- Nizwa same zone
      ('pr-010', 'Nizwa Standard 0-5kg', 'z-nizwa-001', 'z-nizwa-001', 'standard', 1.500, 0.100, 0.000, 0.00, 5.00, 1.500, 5.000, 0.00, true, 1, true),
      ('pr-011', 'Nizwa Express 0-5kg', 'z-nizwa-001', 'z-nizwa-001', 'express', 2.500, 0.200, 0.000, 0.00, 5.00, 2.500, 8.000, 0.00, true, 1, true),
      -- Sur same zone
      ('pr-012', 'Sur Standard 0-5kg', 'z-sur-001', 'z-sur-001', 'standard', 1.500, 0.100, 0.000, 0.00, 5.00, 1.500, 5.000, 0.00, true, 1, true),
      ('pr-013', 'Sur Express 0-5kg', 'z-sur-001', 'z-sur-001', 'express', 2.500, 0.200, 0.000, 0.00, 5.00, 2.500, 8.000, 0.00, true, 1, true),
      -- Cross-zone: Muscat to Salalah (~1000km)
      ('pr-014', 'MCT-SAL Standard', 'z-muscat-001', 'z-salalah-001', 'standard', 5.000, 0.150, 0.005, 0.00, 30.00, 5.000, 25.000, 5.00, true, 1, true),
      ('pr-015', 'MCT-SAL Express', 'z-muscat-001', 'z-salalah-001', 'express', 8.000, 0.200, 0.008, 0.00, 20.00, 8.000, 35.000, 5.00, true, 1, true),
      -- Cross-zone: Muscat to Sohar (~230km)
      ('pr-016', 'MCT-SHR Standard', 'z-muscat-001', 'z-sohar-001', 'standard', 3.000, 0.120, 0.003, 0.00, 30.00, 3.000, 15.000, 3.00, true, 1, true),
      ('pr-017', 'MCT-SHR Express', 'z-muscat-001', 'z-sohar-001', 'express', 5.000, 0.180, 0.005, 0.00, 20.00, 5.000, 22.000, 3.00, true, 1, true),
      -- Cross-zone: Muscat to Nizwa (~165km)
      ('pr-018', 'MCT-NZW Standard', 'z-muscat-001', 'z-nizwa-001', 'standard', 2.500, 0.120, 0.003, 0.00, 30.00, 2.500, 12.000, 3.00, true, 1, true),
      ('pr-019', 'MCT-NZW Express', 'z-muscat-001', 'z-nizwa-001', 'express', 4.500, 0.180, 0.005, 0.00, 20.00, 4.500, 20.000, 3.00, true, 1, true),
      -- Cross-zone: Muscat to Sur (~340km)
      ('pr-020', 'MCT-SUR Standard', 'z-muscat-001', 'z-sur-001', 'standard', 3.500, 0.130, 0.004, 0.00, 30.00, 3.500, 18.000, 4.00, true, 1, true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // ───────────────────────────────────────────────
    // 6. MAINTENANCE RECORDS (5 records)
    // ───────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO maintenance_records (id, vehicle_id, type, status, description, service_provider, cost, odometer_reading, parts_replaced, labor_hours, next_service_km, completed_date, performed_by, notes) VALUES
      ('mr-001', 'v-003', 'oil_change', 'completed', 'Routine oil change and filter replacement', 'Toyota Oman Service Center', 45.500, 18750.25, '["engine_oil","oil_filter","air_filter"]', 1.50, 23750.25, '2024-11-15', 'فهد البرطماني', 'Used synthetic oil 10W-40'),
      ('mr-002', 'v-004', 'brake_service', 'completed', 'Brake pad replacement and disc inspection', 'Al-Futtaim Auto Services', 85.000, 45000.00, '["brake_pads_front","brake_pads_rear","brake_fluid"]', 3.00, 50000.00, '2024-10-20', 'ناصر الراشدي', 'Front pads worn to 3mm'),
      ('mr-003', 'v-001', 'routine', 'completed', '5000km routine inspection', 'BHD Workshop', 25.000, 15000.00, '["wiper_blades"]', 1.00, 20000.00, '2024-12-01', 'سالم الحجري', 'All systems OK'),
      ('mr-004', 'v-008', 'repair', 'in_progress', 'Air conditioning compressor repair', 'Hino Oman', 320.000, 38920.50, '["ac_compressor","ac_gas_r134a"]', 6.00, 43920.50, NULL, 'يوسف العبري', 'Waiting for compressor part'),
      ('mr-005', 'v-006', 'tire_change', 'completed', 'Replace all 4 tires', 'Bridgestone Oman', 180.000, 22000.00, '["tires_4pcs"]', 2.00, 32000.00, '2024-09-10', 'سعيد الهنائي', 'Changed to all-terrain tires')
      ON CONFLICT (id) DO NOTHING;
    `);

    // ───────────────────────────────────────────────
    // 7. SAMPLE SHIPMENTS (20 shipments)
    // ───────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO logistics_shipments (id, tracking_number, order_id, shipment_type, service_type, status, payment_status,
        sender_name, sender_phone, sender_email, sender_address, sender_lat, sender_lng, sender_zone_id,
        recipient_name, recipient_phone, recipient_email, recipient_address, recipient_lat, recipient_lng, recipient_zone_id,
        description, weight_kg, dimensions_cm, volume_cbm, pieces, declared_value, cod_amount,
        is_fragile, is_insured, shipping_cost, total_charge, currency,
        assigned_driver_id, assigned_vehicle_id, current_hub_id,
        estimated_delivery, failure_attempts, created_at) VALUES

      -- Muscat deliveries (1-8)
      ('sh-001', 'BHD2024000001', 'ord-001', 'b2c', 'same_day', 'delivered', 'paid',
        'BHD Store - Qurum', '+968 2400 0001', 'store@bhd.om', 'القرم، شارع القرم، مجمع القرم التجاري', 23.6139, 58.5423, 'z-muscat-001',
        'فاطمة الزدجالية', '+968 9011 2233', NULL, 'القرم، خلف مسجد القرم، مبنى 45', 23.6080, 58.5350, 'z-muscat-001',
        'Electronics - Mobile phone accessories', 0.50, '{"length":20,"width":15,"height":8}', 0.0024, 1, 15.000, NULL,
        false, false, 3.500, 3.675, 'OMR',
        'd-005', 'v-005', 'hub-mct-001',
        '2024-12-18 18:00:00+04', 0, '2024-12-18 08:30:00+04'),

      ('sh-002', 'BHD2024000002', 'ord-002', 'b2c', 'express', 'out_for_delivery', 'cod',
        'BHD Store - Al Khuwair', '+968 2400 0002', 'alkhuwair@bhd.om', 'الخوير، شارع السلطان قابوس، مبنى 12', 23.5880, 58.4000, 'z-muscat-001',
        'محمد السيابي', '+968 9122 3344', NULL, 'الخوير 33، قرب مركز عمان مول، شقة 201', 23.5850, 58.3950, 'z-muscat-001',
        'Clothing items - 3 shirts', 1.20, '{"length":30,"width":25,"height":10}', 0.0075, 1, 45.000, 45.000,
        false, false, 2.700, 2.835, 'OMR',
        'd-001', 'v-001', 'hub-mct-001',
        '2024-12-18 20:00:00+04', 0, '2024-12-17 14:00:00+04'),

      ('sh-003', 'BHD2024000003', 'ord-003', 'b2c', 'standard', 'in_transit', 'paid',
        'BHD Store - Seeb', '+968 2400 0003', 'seeb@bhd.om', 'السيب، شارع المطار', 23.5800, 58.2800, 'z-muscat-001',
        'علي الحبسي', '+968 9233 4455', 'ali.habsi@email.om', 'السيب، منطقة المعبيلة الجنوبية، شارع 7، مبنى 89', 23.5750, 58.2750, 'z-muscat-001',
        'Home appliances - Blender', 2.50, '{"length":25,"width":20,"height":30}', 0.0150, 1, 25.000, NULL,
        false, false, 2.375, 2.494, 'OMR',
        'd-002', 'v-002', 'hub-mct-001',
        '2024-12-19 18:00:00+04', 0, '2024-12-16 10:00:00+04'),

      ('sh-004', 'BHD2024000004', 'ord-004', 'b2c', 'standard', 'confirmed', 'paid',
        'BHD Store - MQ', '+968 2400 0004', 'mq@bhd.om', 'المعبيلة، شارع 18 نوفمبر', 23.5950, 58.5100, 'z-muscat-001',
        'مريم الكيومية', '+968 9344 5566', NULL, 'بوشر، الخوض 6، شارع النخيل، فيلا 12', 23.5650, 58.3800, 'z-muscat-001',
        'Books and stationery', 3.80, '{"length":35,"width":25,"height":15}', 0.0131, 2, 32.000, NULL,
        false, false, 2.570, 2.699, 'OMR',
        NULL, NULL, 'hub-mct-001',
        '2024-12-20 18:00:00+04', 0, '2024-12-18 09:00:00+04'),

      ('sh-005', 'BHD2024000005', 'ord-005', 'b2c', 'express', 'picked_up', 'paid',
        'BHD Store - Azaiba', '+968 2400 0005', 'azaiba@bhd.om', 'العذيبة، شارع 24 يوليو', 23.6000, 58.3500, 'z-muscat-001',
        'نورة البوسعيدية', '+968 9455 6677', NULL, 'العذيبة، شارع المها، مبنى السلام 3', 23.5980, 58.3480, 'z-muscat-001',
        'Cosmetics package', 0.80, '{"length":20,"width":15,"height":12}', 0.0036, 1, 60.000, NULL,
        true, false, 2.660, 2.793, 'OMR',
        'd-005', 'v-005', 'hub-mct-001',
        '2024-12-18 16:00:00+04', 0, '2024-12-18 07:00:00+04'),

      ('sh-006', 'BHD2024000006', 'ord-006', 'b2c', 'same_day', 'delivered', 'cod',
        'BHD Store - Ruwi', '+968 2400 0006', 'ruwi@bhd.om', 'روي، شارع السعادة', 23.6050, 58.5450, 'z-muscat-001',
        'حمد البلوشي', '+968 9566 7788', NULL, 'روي، شارع الخليج، مبنى التجارة 7', 23.6030, 58.5430, 'z-muscat-001',
        'Food delivery - Fresh meals', 1.50, '{"length":30,"width":25,"height":15}', 0.0113, 2, 20.000, 20.000,
        false, false, 3.875, 4.069, 'OMR',
        'd-005', 'v-005', 'hub-mct-001',
        '2024-12-18 14:00:00+04', 0, '2024-12-18 10:00:00+04'),

      ('sh-007', 'BHD2024000007', 'ord-007', 'b2c', 'standard', 'at_hub', 'paid',
        'BHD Store - Ghala', '+968 2400 0007', 'ghala@bhd.om', 'غلا، شارع الوادي', 23.5850, 58.4200, 'z-muscat-001',
        'سلطان السالمي', '+968 9677 8899', 'sultan@email.om', 'الغبرة، شارع المدينة المنورة، فيلا 25', 23.6100, 58.4700, 'z-muscat-001',
        'Sports equipment - Yoga mat', 1.80, '{"length":80,"width":15,"height":15}', 0.0180, 1, 18.000, NULL,
        false, false, 1.680, 1.764, 'OMR',
        NULL, NULL, 'hub-mct-001',
        '2024-12-19 18:00:00+04', 0, '2024-12-17 11:00:00+04'),

      ('sh-008', 'BHD2024000008', 'ord-008', 'b2c', 'express', 'pending', 'pending',
        'BHD Store - Madinat Sultan Qaboos', '+968 2400 0008', 'msq@bhd.om', 'مدينة السلطان قابوس، شارع المطار القديم', 23.5700, 58.4300, 'z-muscat-001',
        'رقية الهنائية', '+968 9788 9900', NULL, 'الخوير، دوار الخوير، شقة 45', 23.5850, 58.4000, 'z-muscat-001',
        'Toy package', 2.20, '{"length":40,"width":30,"height":20}', 0.0240, 1, 55.000, NULL,
        false, true, 2.940, 3.087, 'OMR',
        NULL, NULL, 'hub-mct-001',
        '2024-12-19 14:00:00+04', 0, '2024-12-18 16:00:00+04'),

      -- Salalah deliveries (9-12)
      ('sh-009', 'BHD2024000009', 'ord-009', 'b2c', 'standard', 'out_for_delivery', 'cod',
        'BHD Store - Salalah Central', '+968 2400 0009', 'salalah@bhd.om', 'صلالة، شارع السلام، مجصلات، مبنى 5', 17.0194, 54.0897, 'z-salalah-001',
        'خالد الرواس', '+968 9899 0011', NULL, 'صلالة، صلالة الجديدة، شارع 23 يوليو', 17.0250, 54.0950, 'z-salalah-001',
        'Home decor items', 4.50, '{"length":50,"width":30,"height":25}', 0.0375, 2, 85.000, 85.000,
        true, false, 1.950, 2.048, 'OMR',
        'd-006', 'v-006', 'hub-sal-001',
        '2024-12-18 17:00:00+04', 0, '2024-12-17 08:00:00+04'),

      ('sh-010', 'BHD2024000010', 'ord-010', 'b2c', 'express', 'in_transit', 'paid',
        'BHD Store - Salalah Central', '+968 2400 0009', 'salalah@bhd.om', 'صلالة، شارع السلام', 17.0194, 54.0897, 'z-salalah-001',
        'ليلى البطاشية', '+968 9900 1122', NULL, 'صلالة، منطقة العوقد، شارع 15', 17.0350, 54.1200, 'z-salalah-001',
        'Baby products', 3.20, '{"length":40,"width":30,"height":25}', 0.0300, 1, 120.000, NULL,
        false, false, 3.140, 3.297, 'OMR',
        'd-008', 'v-008', 'hub-sal-001',
        '2024-12-18 18:00:00+04', 0, '2024-12-17 12:00:00+04'),

      ('sh-011', 'BHD2024000011', 'ord-011', 'b2c', 'same_day', 'delivered', 'paid',
        'BHD Store - Salalah Central', '+968 2400 0009', 'salalah@bhd.om', 'صلالة، شارع السلام', 17.0194, 54.0897, 'z-salalah-001',
        'عبدالرحمن الحوسني', '+968 9011 2233', NULL, 'صلالة، حيفة، شارع البلدية', 17.0100, 54.0800, 'z-salalah-001',
        'Pharmacy items', 0.30, '{"length":15,"width":10,"height":8}', 0.0012, 1, 12.000, NULL,
        false, false, 3.575, 3.754, 'OMR',
        'd-006', 'v-006', 'hub-sal-001',
        '2024-12-18 15:00:00+04', 0, '2024-12-18 08:00:00+04'),

      ('sh-012', 'BHD2024000012', 'ord-012', 'b2c', 'standard', 'confirmed', 'paid',
        'BHD Store - Salalah Central', '+968 2400 0009', 'salalah@bhd.om', 'صلالة، شارع السلام', 17.0194, 54.0897, 'z-salalah-001',
        'هند المقبالية', '+968 9122 3344', NULL, 'صلالة، منطقة صحلنوت، شارع 40', 17.0550, 54.1400, 'z-salalah-001',
        'Kitchenware set', 5.80, '{"length":45,"width":35,"height":30}', 0.0473, 1, 95.000, NULL,
        true, true, 2.080, 2.184, 'OMR',
        NULL, NULL, 'hub-sal-001',
        '2024-12-20 18:00:00+04', 0, '2024-12-18 14:00:00+04'),

      -- Sohar deliveries (13-15)
      ('sh-013', 'BHD2024000013', 'ord-013', 'b2c', 'standard', 'out_for_delivery', 'cod',
        'BHD Store - Sohar', '+968 2400 0010', 'sohar@bhd.om', 'صحار، شارع الملكة، مجمع صحار التجاري', 24.3475, 56.7094, 'z-sohar-001',
        'يوسف الشبيبي', '+968 9233 4455', NULL, 'صحار، الحي التجاري، شارع 15', 24.3500, 56.7150, 'z-sohar-001',
        'Electronics - Headphones', 0.40, '{"length":20,"width":15,"height":10}', 0.0030, 1, 35.000, 35.000,
        false, false, 1.540, 1.617, 'OMR',
        'd-009', 'v-009', 'hub-shr-001',
        '2024-12-18 16:00:00+04', 0, '2024-12-17 10:00:00+04'),

      ('sh-014', 'BHD2024000014', 'ord-014', 'b2c', 'express', 'picked_up', 'paid',
        'BHD Store - Sohar', '+968 2400 0010', 'sohar@bhd.om', 'صحار، شارع الملكة', 24.3475, 56.7094, 'z-sohar-001',
        'منى الحارثية', '+968 9344 5566', NULL, 'صحار، الفليج، شارع السلام', 24.3600, 56.7200, 'z-sohar-001',
        'Shoes - 2 pairs', 1.60, '{"length":35,"width":25,"height":20}', 0.0175, 1, 50.000, NULL,
        false, false, 2.820, 2.961, 'OMR',
        'd-010', 'v-010', 'hub-shr-001',
        '2024-12-18 14:00:00+04', 0, '2024-12-18 06:00:00+04'),

      ('sh-015', 'BHD2024000015', 'ord-015', 'b2c', 'standard', 'at_hub', 'pending',
        'BHD Store - Sohar', '+968 2400 0010', 'sohar@bhd.om', 'صحار، شارع الملكة', 24.3475, 56.7094, 'z-sohar-001',
        'خالد المعمري', '+968 9455 6677', NULL, 'صحار، وادي الحباس، شارع 22', 24.3400, 56.7000, 'z-sohar-001',
        'Furniture parts', 8.50, '{"length":80,"width":40,"height":20}', 0.0640, 1, 150.000, NULL,
        false, false, 3.020, 3.171, 'OMR',
        NULL, NULL, 'hub-shr-001',
        '2024-12-19 18:00:00+04', 0, '2024-12-17 14:00:00+04'),

      -- Cross-zone deliveries (16-20)
      ('sh-016', 'BHD2024000016', 'ord-016', 'b2c', 'standard', 'in_transit', 'paid',
        'BHD Store - Qurum', '+968 2400 0001', 'store@bhd.om', 'القرم، شارع القرم', 23.6139, 58.5423, 'z-muscat-001',
        'عائشة البوسعيدية', '+968 9566 7788', NULL, 'نزوى، شارع السلام، قرب جامع السلطان قابوس', 22.9260, 57.5342, 'z-nizwa-001',
        'Cross-zone delivery', 2.80, '{"length":35,"width":25,"height":20}', 0.0175, 1, 70.000, NULL,
        false, false, 2.836, 2.978, 'OMR',
        'd-003', 'v-003', 'hub-mct-001',
        '2024-12-20 18:00:00+04', 0, '2024-12-16 08:00:00+04'),

      ('sh-017', 'BHD2024000017', 'ord-017', 'b2c', 'express', 'picked_up', 'cod',
        'BHD Store - Al Khuwair', '+968 2400 0002', 'alkhuwair@bhd.om', 'الخوير، شارع السلطان قابوس', 23.5880, 58.4000, 'z-muscat-001',
        'مبارك الغافري', '+968 9677 8899', NULL, 'صحار، الحي الصناعي، شارع 10', 24.3475, 56.7094, 'z-sohar-001',
        'Business documents and samples', 1.50, '{"length":30,"width":25,"height":10}', 0.0075, 1, 0.000, 200.000,
        false, false, 5.450, 5.723, 'OMR',
        'd-004', 'v-004', 'hub-mct-001',
        '2024-12-19 12:00:00+04', 0, '2024-12-18 10:00:00+04'),

      ('sh-018', 'BHD2024000018', 'ord-018', 'b2c', 'standard', 'pending', 'paid',
        'BHD Store - Seeb', '+968 2400 0003', 'seeb@bhd.om', 'السيب، شارع المطار', 23.5800, 58.2800, 'z-muscat-001',
        'سلمى الحجري', '+968 9788 9900', NULL, 'صور، شارع الصناعية، مبنى 12', 22.5667, 59.5289, 'z-sur-001',
        'Gift package', 1.20, '{"length":25,"width":20,"height":15}', 0.0075, 1, 40.000, NULL,
        true, false, 3.655, 3.838, 'OMR',
        NULL, NULL, 'hub-mct-001',
        '2024-12-21 18:00:00+04', 0, '2024-12-18 12:00:00+04'),

      ('sh-019', 'BHD2024000019', 'ord-019', 'b2c', 'standard', 'failed_delivery', 'cod',
        'BHD Store - Ruwi', '+968 2400 0006', 'ruwi@bhd.om', 'روي، شارع السعادة', 23.6050, 58.5450, 'z-muscat-001',
        'فهد الكلباني', '+968 9899 0011', NULL, 'بوشر، شاطئ القرم، فيلا 78', 23.6000, 58.5300, 'z-muscat-001',
        'Perishable goods - Chocolates', 0.80, '{"length":25,"width":20,"height":12}', 0.0060, 1, 25.000, 25.000,
        false, false, 1.580, 1.659, 'OMR',
        'd-001', 'v-001', 'hub-mct-001',
        '2024-12-17 18:00:00+04', 2, '2024-12-16 09:00:00+04'),

      ('sh-020', 'BHD2024000020', 'ord-020', 'b2c', 'same_day', 'delivered', 'paid',
        'BHD Store - MQ', '+968 2400 0004', 'mq@bhd.om', 'المعبيلة، شارع 18 نوفمبر', 23.5950, 58.5100, 'z-muscat-001',
        'نبيل الرواحي', '+968 9900 1122', NULL, 'المعبيلة، خلف مجمع عمان أفنيوز، شقة 55', 23.5900, 58.5050, 'z-muscat-001',
        'Urgent medicine delivery', 0.20, '{"length":15,"width":10,"height":5}', 0.0008, 1, 8.000, NULL,
        false, false, 3.625, 3.806, 'OMR',
        'd-005', 'v-005', 'hub-mct-001',
        '2024-12-18 13:00:00+04', 0, '2024-12-18 09:00:00+04');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete in reverse order
    await queryRunner.query(`DELETE FROM logistics_shipments WHERE id LIKE 'sh-%'`);
    await queryRunner.query(`DELETE FROM maintenance_records WHERE id LIKE 'mr-%'`);
    await queryRunner.query(`DELETE FROM pricing_rules WHERE id LIKE 'pr-%'`);
    await queryRunner.query(`DELETE FROM drivers WHERE id LIKE 'd-%'`);
    await queryRunner.query(`DELETE FROM vehicles WHERE id LIKE 'v-%'`);
    await queryRunner.query(`DELETE FROM hubs WHERE id LIKE 'hub-%'`);
    await queryRunner.query(`DELETE FROM zones WHERE id LIKE 'z-%'`);
  }
}
