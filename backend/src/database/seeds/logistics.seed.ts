/**
 * Logistics Seed Data - Complete Omani Dataset
 * ============================================
 * Realistic seed data for the BHD Logistics Module
 * Uses authentic Omani addresses, phone patterns, and vehicle types.
 */

export interface ZoneSeed {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  centerLat: number;
  centerLng: number;
  deliveryDays: number[];
  sameDayAvailable: boolean;
  cutoffHour: number | null;
}

export interface HubSeed {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  zoneId: string;
  address: string;
  lat: number;
  lng: number;
  managerName: string;
  managerPhone: string;
  capacityDaily: number;
  operatingHours: { open: string; close: string; days: number[] };
}

export interface VehicleSeed {
  id: string;
  plateNumber: string;
  plateCode: string;
  make: string;
  model: string;
  year: number;
  type: string;
  capacityKg: number;
  capacityCbm: number;
  fuelType: string;
  hubId: string;
}

export interface DriverSeed {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  civilId: string;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  vehicleId: string;
  hubId: string;
  zoneId: string;
  employmentType: string;
  dateOfBirth: string;
  emergencyName: string;
  emergencyPhone: string;
}

// ───────────────────────────────────────────────
// ZONES - 5 Omani Governorates
// ───────────────────────────────────────────────
export const ZONES: ZoneSeed[] = [
  {
    id: 'z-muscat-001',
    nameAr: 'محافظة مسقط',
    nameEn: 'Muscat Governorate',
    code: 'MCT',
    centerLat: 23.6139,
    centerLng: 58.5423,
    deliveryDays: [0, 1, 2, 3, 4, 5, 6],
    sameDayAvailable: true,
    cutoffHour: 12,
  },
  {
    id: 'z-salalah-001',
    nameAr: 'محافظة ظفار',
    nameEn: 'Dhofar Governorate (Salalah)',
    code: 'SAL',
    centerLat: 17.0194,
    centerLng: 54.0897,
    deliveryDays: [0, 1, 2, 3, 4, 5, 6],
    sameDayAvailable: true,
    cutoffHour: 11,
  },
  {
    id: 'z-sohar-001',
    nameAr: 'محافظة شمال الباطنة',
    nameEn: 'North Al Batinah (Sohar)',
    code: 'SHR',
    centerLat: 24.3475,
    centerLng: 56.7094,
    deliveryDays: [0, 1, 2, 3, 4, 5],
    sameDayAvailable: false,
    cutoffHour: null,
  },
  {
    id: 'z-nizwa-001',
    nameAr: 'محافظة الداخلية',
    nameEn: 'Ad Dakhiliyah (Nizwa)',
    code: 'NZW',
    centerLat: 22.9260,
    centerLng: 57.5342,
    deliveryDays: [0, 1, 2, 3, 4, 5],
    sameDayAvailable: false,
    cutoffHour: null,
  },
  {
    id: 'z-sur-001',
    nameAr: 'محافظة جنوب الشرقية',
    nameEn: 'South Ash Sharqiyah (Sur)',
    code: 'SUR',
    centerLat: 22.5667,
    centerLng: 59.5289,
    deliveryDays: [0, 1, 2, 3, 4],
    sameDayAvailable: false,
    cutoffHour: null,
  },
];

// ───────────────────────────────────────────────
// HUBS - 3 Distribution Centers
// ───────────────────────────────────────────────
export const HUBS: HubSeed[] = [
  {
    id: 'hub-mct-001',
    nameAr: 'المركز الرئيسي - مسقط',
    nameEn: 'Central Hub - Muscat',
    code: 'MCT-HQ',
    zoneId: 'z-muscat-001',
    address: 'السيب، منطقة جبل السابق، شارع الوكالات، مقابل مركز السيب التجاري، مبنى 45',
    lat: 23.6100,
    lng: 58.5400,
    managerName: 'خالد ناصر البلوشي',
    managerPhone: '+968 9123 4567',
    capacityDaily: 800,
    operatingHours: { open: '07:00', close: '22:00', days: [0, 1, 2, 3, 4, 5, 6] },
  },
  {
    id: 'hub-sal-001',
    nameAr: 'مركز التوزيع - صلالة',
    nameEn: 'Distribution Center - Salalah',
    code: 'SAL-LC',
    zoneId: 'z-salalah-001',
    address: 'صلالة، المنطقة الصناعية، شارع السلام، قطعة 12، مبنى التوصيل السريع',
    lat: 17.0150,
    lng: 54.0850,
    managerName: 'سعيد علي الهنائي',
    managerPhone: '+968 9234 5678',
    capacityDaily: 400,
    operatingHours: { open: '08:00', close: '20:00', days: [0, 1, 2, 3, 4, 5, 6] },
  },
  {
    id: 'hub-shr-001',
    nameAr: 'مركز التوزيع - صحار',
    nameEn: 'Distribution Center - Sohar',
    code: 'SHR-DC',
    zoneId: 'z-sohar-001',
    address: 'صحار، المنطقة الصناعية، شارع الملكة، مجمع صحار اللوجستي',
    lat: 24.3450,
    lng: 56.7050,
    managerName: 'محمد سالم الشبيبي',
    managerPhone: '+968 9345 6789',
    capacityDaily: 350,
    operatingHours: { open: '08:00', close: '20:00', days: [0, 1, 2, 3, 4, 5] },
  },
];

// ───────────────────────────────────────────────
// VEHICLES - Common Omani fleet types
// ───────────────────────────────────────────────
export const VEHICLES: VehicleSeed[] = [
  {
    id: 'v-001', plateNumber: '12345', plateCode: 'A',
    make: 'Toyota', model: 'Hilux Double Cab', year: 2023,
    type: 'pickup', capacityKg: 1000, capacityCbm: 3.5, fuelType: 'diesel', hubId: 'hub-mct-001',
  },
  {
    id: 'v-002', plateNumber: '23456', plateCode: 'B',
    make: 'Toyota', model: 'Hiace Van', year: 2022,
    type: 'van', capacityKg: 1500, capacityCbm: 8.0, fuelType: 'diesel', hubId: 'hub-mct-001',
  },
  {
    id: 'v-003', plateNumber: '34567', plateCode: 'A',
    make: 'Mitsubishi Fuso', model: 'Canter FE84', year: 2023,
    type: 'truck_3t', capacityKg: 3000, capacityCbm: 18.0, fuelType: 'diesel', hubId: 'hub-mct-001',
  },
  {
    id: 'v-004', plateNumber: '45678', plateCode: 'C',
    make: 'Isuzu', model: 'NPR 75', year: 2021,
    type: 'truck_5t', capacityKg: 5000, capacityCbm: 28.0, fuelType: 'diesel', hubId: 'hub-mct-001',
  },
  {
    id: 'v-005', plateNumber: '56789', plateCode: 'D',
    make: 'Yamaha', model: 'MT-07', year: 2023,
    type: 'motorcycle', capacityKg: 50, capacityCbm: 0.15, fuelType: 'petrol', hubId: 'hub-mct-001',
  },
  {
    id: 'v-006', plateNumber: '67890', plateCode: 'A',
    make: 'Toyota', model: 'Hilux Double Cab', year: 2022,
    type: 'pickup', capacityKg: 1000, capacityCbm: 3.5, fuelType: 'diesel', hubId: 'hub-sal-001',
  },
  {
    id: 'v-007', plateNumber: '78901', plateCode: 'B',
    make: 'Toyota', model: 'Coaster', year: 2023,
    type: 'van', capacityKg: 2000, capacityCbm: 12.0, fuelType: 'diesel', hubId: 'hub-sal-001',
  },
  {
    id: 'v-008', plateNumber: '89012', plateCode: 'A',
    make: 'Hino', model: '300 Series XZU', year: 2021,
    type: 'truck_3t', capacityKg: 3500, capacityCbm: 20.0, fuelType: 'diesel', hubId: 'hub-sal-001',
  },
  {
    id: 'v-009', plateNumber: '90123', plateCode: 'C',
    make: 'Mitsubishi Fuso', model: 'Canter Wide', year: 2022,
    type: 'truck_5t', capacityKg: 5000, capacityCbm: 28.0, fuelType: 'diesel', hubId: 'hub-shr-001',
  },
  {
    id: 'v-010', plateNumber: '01234', plateCode: 'D',
    make: 'Yamaha', model: 'FZ-S V3', year: 2023,
    type: 'motorcycle', capacityKg: 30, capacityCbm: 0.10, fuelType: 'petrol', hubId: 'hub-shr-001',
  },
];

// ───────────────────────────────────────────────
// DRIVERS - Realistic Omani driver profiles
// ───────────────────────────────────────────────
export const DRIVERS: DriverSeed[] = [
  {
    id: 'd-001', firstName: 'أحمد', lastName: 'ناصر البلوشي',
    phone: '+968 9012 3456', email: 'ahmed.balushi@bhd.om',
    civilId: '10123456', licenseNumber: 'L-2020-001', licenseType: 'light',
    licenseExpiry: '2026-05-15', vehicleId: 'v-001', hubId: 'hub-mct-001',
    zoneId: 'z-muscat-001', employmentType: 'full_time',
    dateOfBirth: '1988-03-10', emergencyName: 'محمد البلوشي', emergencyPhone: '+968 9012 3457',
  },
  {
    id: 'd-002', firstName: 'خالد', lastName: 'سالم السيابي',
    phone: '+968 9123 4567', email: 'khalid.siyabi@bhd.om',
    civilId: '10234567', licenseNumber: 'L-2019-002', licenseType: 'light',
    licenseExpiry: '2027-02-20', vehicleId: 'v-002', hubId: 'hub-mct-001',
    zoneId: 'z-muscat-001', employmentType: 'full_time',
    dateOfBirth: '1990-07-22', emergencyName: 'فاطمة السيابية', emergencyPhone: '+968 9123 4568',
  },
  {
    id: 'd-003', firstName: 'سالم', lastName: 'مبارك الحجري',
    phone: '+968 9234 5678', email: 'salem.hajri@bhd.om',
    civilId: '10345678', licenseNumber: 'L-2021-003', licenseType: 'heavy',
    licenseExpiry: '2026-08-10', vehicleId: 'v-003', hubId: 'hub-mct-001',
    zoneId: 'z-muscat-001', employmentType: 'full_time',
    dateOfBirth: '1985-11-05', emergencyName: 'ناصر الحجري', emergencyPhone: '+968 9234 5679',
  },
  {
    id: 'd-004', firstName: 'مبارك', lastName: 'علي الشبيبي',
    phone: '+968 9345 6789', email: 'mubarak.shabibi@bhd.om',
    civilId: '10456789', licenseNumber: 'L-2020-004', licenseType: 'heavy',
    licenseExpiry: '2027-01-25', vehicleId: 'v-004', hubId: 'hub-mct-001',
    zoneId: 'z-muscat-001', employmentType: 'full_time',
    dateOfBirth: '1987-04-18', emergencyName: 'عائشة الشبيبية', emergencyPhone: '+968 9345 6790',
  },
  {
    id: 'd-005', firstName: 'فهد', lastName: 'محمد البرطماني',
    phone: '+968 9456 7890', email: 'fahd.bartamani@bhd.om',
    civilId: '10567890', licenseNumber: 'L-2022-005', licenseType: 'motorcycle',
    licenseExpiry: '2026-11-30', vehicleId: 'v-005', hubId: 'hub-mct-001',
    zoneId: 'z-muscat-001', employmentType: 'part_time',
    dateOfBirth: '1995-09-12', emergencyName: 'عبدالله البرطماني', emergencyPhone: '+968 9456 7891',
  },
  {
    id: 'd-006', firstName: 'سعيد', lastName: 'خالد الهنائي',
    phone: '+968 9567 8901', email: 'saeed.hinai@bhd.om',
    civilId: '10678901', licenseNumber: 'L-2019-006', licenseType: 'light',
    licenseExpiry: '2027-03-15', vehicleId: 'v-006', hubId: 'hub-sal-001',
    zoneId: 'z-salalah-001', employmentType: 'full_time',
    dateOfBirth: '1989-01-28', emergencyName: 'مريم الهنائية', emergencyPhone: '+968 9567 8902',
  },
  {
    id: 'd-007', firstName: 'ناصر', lastName: 'سعيد الراشدي',
    phone: '+968 9678 9012', email: 'nasser.rashdi@bhd.om',
    civilId: '10789012', licenseNumber: 'L-2021-007', licenseType: 'light',
    licenseExpiry: '2026-07-20', vehicleId: 'v-007', hubId: 'hub-sal-001',
    zoneId: 'z-salalah-001', employmentType: 'full_time',
    dateOfBirth: '1991-06-08', emergencyName: 'حمد الراشدي', emergencyPhone: '+968 9678 9013',
  },
  {
    id: 'd-008', firstName: 'يوسف', lastName: 'أحمد العبري',
    phone: '+968 9789 0123', email: 'yousef.abri@bhd.om',
    civilId: '10890123', licenseNumber: 'L-2020-008', licenseType: 'heavy',
    licenseExpiry: '2026-12-05', vehicleId: 'v-008', hubId: 'hub-sal-001',
    zoneId: 'z-salalah-001', employmentType: 'full_time',
    dateOfBirth: '1986-12-01', emergencyName: 'سلمى العبرية', emergencyPhone: '+968 9789 0124',
  },
  {
    id: 'd-009', firstName: 'عبدالله', lastName: 'ناصر الغافري',
    phone: '+968 9890 1234', email: 'abdullah.ghafri@bhd.om',
    civilId: '10901234', licenseNumber: 'L-2022-009', licenseType: 'heavy',
    licenseExpiry: '2027-04-18', vehicleId: 'v-009', hubId: 'hub-shr-001',
    zoneId: 'z-sohar-001', employmentType: 'full_time',
    dateOfBirth: '1992-08-14', emergencyName: 'مبارك الغافري', emergencyPhone: '+968 9890 1235',
  },
  {
    id: 'd-010', firstName: 'هيثم', lastName: 'سالم السيابي',
    phone: '+968 9901 2345', email: 'haitham.siyabi@bhd.om',
    civilId: '11012345', licenseNumber: 'L-2023-010', licenseType: 'motorcycle',
    licenseExpiry: '2027-06-22', vehicleId: 'v-010', hubId: 'hub-shr-001',
    zoneId: 'z-sohar-001', employmentType: 'part_time',
    dateOfBirth: '1996-02-25', emergencyName: 'خالد السيابي', emergencyPhone: '+968 9901 2346',
  },
];

// ───────────────────────────────────────────────
// REAL OMANI ADDRESSES - Sample delivery addresses
// ───────────────────────────────────────────────
export const OMANI_ADDRESSES = [
  // Muscat addresses
  { district: 'القرم', street: 'شارع القرم', landmark: 'مجمع القرم التجاري', lat: 23.6080, lng: 58.5350, zone: 'z-muscat-001' },
  { district: 'الخوير', street: 'شارع السلطان قابوس', landmark: 'خلف مركز عمان مول', lat: 23.5850, lng: 58.3950, zone: 'z-muscat-001' },
  { district: 'السيب', street: 'شارع المطار', landmark: 'منطقة المعبيلة الجنوبية', lat: 23.5750, lng: 58.2750, zone: 'z-muscat-001' },
  { district: 'بوشر', street: 'شارع النخيل', landmark: 'الخوض 6', lat: 23.5650, lng: 58.3800, zone: 'z-muscat-001' },
  { district: 'العذيبة', street: 'شارع المها', landmark: 'قرب جامع العذيبة', lat: 23.5980, lng: 58.3480, zone: 'z-muscat-001' },
  { district: 'روي', street: 'شارع السعادة', landmark: 'مبنى التجارة', lat: 23.6030, lng: 58.5430, zone: 'z-muscat-001' },
  { district: 'الغبرة', street: 'شارع المدينة المنورة', landmark: 'قرب مطعم البحر', lat: 23.6100, lng: 58.4700, zone: 'z-muscat-001' },
  { district: 'مدينة السلطان قابوس', street: 'شارع المطار القديم', landmark: 'دوار الك.unpack', lat: 23.5700, lng: 58.4300, zone: 'z-muscat-001' },
  { district: 'المعبيلة', street: 'شارع 18 نوفمبر', landmark: 'خلف مجمع عمان أفنيوز', lat: 23.5900, lng: 58.5050, zone: 'z-muscat-001' },
  { district: 'السيب', street: 'شارع الوكالات', landmark: 'جبل السابق', lat: 23.6120, lng: 58.5380, zone: 'z-muscat-001' },
  // Salalah addresses
  { district: 'صلالة الجديدة', street: 'شارع 23 يوليو', landmark: 'قرب مسجد السلطان قابوس', lat: 17.0250, lng: 54.0950, zone: 'z-salalah-001' },
  { district: 'العوقد', street: 'شارع 15', landmark: 'مجمع العوقد التجاري', lat: 17.0350, lng: 54.1200, zone: 'z-salalah-001' },
  { district: 'حيفة', street: 'شارع البلدية', landmark: 'سوق حيفة', lat: 17.0100, lng: 54.0800, zone: 'z-salalah-001' },
  { district: 'صحلنوت', street: 'شارع 40', landmark: 'جامعة ظفار', lat: 17.0550, lng: 54.1400, zone: 'z-salalah-001' },
  { district: 'الدحيز', street: 'شارع النور', landmark: 'مستشفى سلطان قابوس', lat: 17.0200, lng: 54.1000, zone: 'z-salalah-001' },
  // Sohar addresses
  { district: 'الحي التجاري', street: 'شارع 15', landmark: 'سوق صحار', lat: 24.3500, lng: 56.7150, zone: 'z-sohar-001' },
  { district: 'الفليج', street: 'شارع السلام', landmark: 'مجمع الفليج', lat: 24.3600, lng: 56.7200, zone: 'z-sohar-001' },
  { district: 'وادي الحباس', street: 'شارع 22', landmark: 'المنطقة الصناعية', lat: 24.3400, lng: 56.7000, zone: 'z-sohar-001' },
  // Nizwa addresses
  { district: 'فلج النسور', street: 'شارع السلام', landmark: 'قلعة نزوى', lat: 22.9260, lng: 57.5342, zone: 'z-nizwa-001' },
  { district: 'الدريز', street: 'شارع الجامع', landmark: 'سوق نزوى', lat: 22.9300, lng: 57.5400, zone: 'z-nizwa-001' },
  // Sur addresses
  { district: 'العينة', street: 'شارع الصناعية', landmark: 'ميناء صور', lat: 22.5667, lng: 59.5289, zone: 'z-sur-001' },
  { district: 'الشباب', street: 'شارع البلدية', landmark: 'كورنيش صور', lat: 22.5700, lng: 59.5350, zone: 'z-sur-001' },
];

// ───────────────────────────────────────────────
// ZONE DISTANCE MATRIX (km) - Approximate Omani road distances
// Used for pricing calculations
// ───────────────────────────────────────────────
export const ZONE_DISTANCE_MATRIX: Record<string, Record<string, number>> = {
  'z-muscat-001': {
    'z-muscat-001': 15,    // Intra-city avg
    'z-salalah-001': 1020, // Via Route 31
    'z-sohar-001': 230,    // Via Route 1
    'z-nizwa-001': 165,    // Via Route 15
    'z-sur-001': 340,      // Via Route 17
  },
  'z-salalah-001': {
    'z-muscat-001': 1020,
    'z-salalah-001': 12,   // Intra-city avg
    'z-sohar-001': 1080,   // Via Muscat
    'z-nizwa-001': 950,    // Via Route 31
    'z-sur-001': 680,      // Via Route 31 coastal
  },
  'z-sohar-001': {
    'z-muscat-001': 230,
    'z-salalah-001': 1080,
    'z-sohar-001': 10,     // Intra-city avg
    'z-nizwa-001': 180,    // Via Route 13
    'z-sur-001': 420,      // Via Muscat
  },
  'z-nizwa-001': {
    'z-muscat-001': 165,
    'z-salalah-001': 950,
    'z-sohar-001': 180,
    'z-nizwa-001': 8,      // Intra-city avg
    'z-sur-001': 280,      // Via Route 23
  },
  'z-sur-001': {
    'z-muscat-001': 340,
    'z-salalah-001': 680,
    'z-sohar-001': 420,
    'z-nizwa-001': 280,
    'z-sur-001': 8,        // Intra-city avg
  },
};

// ───────────────────────────────────────────────
// PRICING TIERS - Service level definitions
// ───────────────────────────────────────────────
export const SERVICE_TIERS = [
  { type: 'standard', nameAr: 'قياسي', nameEn: 'Standard', deliveryHours: '48-72', basePrice: 1.5 },
  { type: 'express', nameAr: 'سريع', nameEn: 'Express', deliveryHours: '24-48', basePrice: 2.5 },
  { type: 'same_day', nameAr: 'نفس اليوم', nameEn: 'Same Day', deliveryHours: '4-8', basePrice: 3.5 },
  { type: 'next_day', nameAr: 'اليوم التالي', nameEn: 'Next Day', deliveryHours: '18-24', basePrice: 2.0 },
  { type: 'economy', nameAr: 'اقتصادي', nameEn: 'Economy', deliveryHours: '3-5 days', basePrice: 1.0 },
];

// ───────────────────────────────────────────────
// TRACKING STATUS WORKFLOW
// ───────────────────────────────────────────────
export const TRACKING_STATUS_WORKFLOW = [
  { status: 'draft', labelAr: 'مسودة', labelEn: 'Draft', icon: 'edit', color: '#9e9e9e' },
  { status: 'pending', labelAr: 'معلق', labelEn: 'Pending', icon: 'clock', color: '#ffc107' },
  { status: 'confirmed', labelAr: 'مؤكد', labelEn: 'Confirmed', icon: 'check-circle', color: '#4caf50' },
  { status: 'picked_up', labelAr: 'تم الاستلام', labelEn: 'Picked Up', icon: 'box', color: '#2196f3' },
  { status: 'in_transit', labelAr: 'في الطريق', labelEn: 'In Transit', icon: 'truck', color: '#2196f3' },
  { status: 'at_hub', labelAr: 'في المركز', labelEn: 'At Hub', icon: 'warehouse', color: '#ff9800' },
  { status: 'out_for_delivery', labelAr: 'خارج للتوصيل', labelEn: 'Out for Delivery', icon: 'shipping-fast', color: '#9c27b0' },
  { status: 'delivered', labelAr: 'تم التوصيل', labelEn: 'Delivered', icon: 'check-double', color: '#4caf50' },
  { status: 'failed_delivery', labelAr: 'فشل التوصيل', labelEn: 'Failed Delivery', icon: 'times-circle', color: '#f44336' },
  { status: 'returned', labelAr: 'مُعاد', labelEn: 'Returned', icon: 'undo', color: '#795548' },
  { status: 'cancelled', labelAr: 'ملغي', labelEn: 'Cancelled', icon: 'ban', color: '#f44336' },
  { status: 'on_hold', labelAr: 'في الانتظار', labelEn: 'On Hold', icon: 'pause-circle', color: '#ff9800' },
];

// ───────────────────────────────────────────────
// HELPER: Generate tracking number
// ───────────────────────────────────────────────
export function generateTrackingNumber(sequence: number): string {
  const prefix = 'BHD';
  const year = new Date().getFullYear();
  const seq = String(sequence).padStart(6, '0');
  return `${prefix}${year}${seq}`;
}

// ───────────────────────────────────────────────
// HELPER: Calculate shipping cost
// ───────────────────────────────────────────────
export function calculateShippingCost(
  fromZoneId: string,
  toZoneId: string,
  serviceType: string,
  weightKg: number,
): { basePrice: number; weightCharge: number; total: number } {
  const distance = ZONE_DISTANCE_MATRIX[fromZoneId]?.[toZoneId] ?? 100;
  const service = SERVICE_TIERS.find(s => s.type === serviceType) ?? SERVICE_TIERS[0];

  const basePrice = service.basePrice;
  const weightCharge = weightKg * 0.15;
  const distanceCharge = distance * 0.003;
  const total = basePrice + weightCharge + distanceCharge;

  return {
    basePrice: Math.round(basePrice * 1000) / 1000,
    weightCharge: Math.round(weightCharge * 1000) / 1000,
    total: Math.round(total * 1000) / 1000,
  };
}

// ───────────────────────────────────────────────
// HELPER: Estimate delivery date
// ───────────────────────────────────────────────
export function estimateDeliveryDate(
  serviceType: string,
  zoneId: string,
): Date {
  const now = new Date();
  const hoursMap: Record<string, number> = {
    same_day: 6,
    express: 30,
    next_day: 20,
    standard: 54,
    economy: 96,
  };
  const hours = hoursMap[serviceType] ?? 54;
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

// ───────────────────────────────────────────────
// DEFAULT EXPORT
// ───────────────────────────────────────────────
export default {
  ZONES,
  HUBS,
  VEHICLES,
  DRIVERS,
  OMANI_ADDRESSES,
  ZONE_DISTANCE_MATRIX,
  SERVICE_TIERS,
  TRACKING_STATUS_WORKFLOW,
  generateTrackingNumber,
  calculateShippingCost,
  estimateDeliveryDate,
};
