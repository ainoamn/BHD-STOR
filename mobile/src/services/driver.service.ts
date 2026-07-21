import type {
  Shipment,
  ShipmentStatus,
  Route,
  Earning,
  EarningPeriod,
  IssueReport,
  DeliveryCompletionData,
  IssueType,
  DriverProfile,
} from '../types/driver.types';

const API_BASE_URL = 'https://api.bhdlogistics.com/v1';
const MOCK_DELAY = 500;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockShipments: Shipment[] = [
  {
    id: 'SHP-001',
    trackingNumber: 'BHD-2024-001001',
    status: 'assigned',
    serviceType: 'express',
    pickup: {
      name: 'ABC Electronics',
      phone: '+973 3333 1111',
      address: 'Building 123, Road 456, Block 789, Manama',
      lat: 26.2285,
      lng: 50.586,
      notes: 'Pickup from warehouse entrance',
    },
    delivery: {
      name: 'Mohammed Al Khalifa',
      phone: '+973 3444 2222',
      address: 'Villa 45, Road 12, Block 338, Adliya',
      lat: 26.2154,
      lng: 50.5832,
      notes: 'Ring doorbell twice',
    },
    package: {
      weight: 2.5,
      dimensions: { length: 30, width: 20, height: 15 },
      description: 'Electronics - Smartphone',
      value: 250,
      pieces: 1,
    },
    codAmount: 250,
    notes: 'Fragile item - handle with care',
    otp: '3847',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'SHP-002',
    trackingNumber: 'BHD-2024-001002',
    status: 'picked_up',
    serviceType: 'standard',
    pickup: {
      name: 'Fresh Foods Market',
      phone: '+973 3555 6666',
      address: 'Shop 12, Avenue 28, Block 245, Seef',
      lat: 26.2361,
      lng: 50.543,
    },
    delivery: {
      name: 'Fatima Hassan',
      phone: '+973 3666 7777',
      address: 'Apartment 8B, Building 22, Road 15, Juffair',
      lat: 26.2087,
      lng: 50.6075,
      notes: 'Call upon arrival',
    },
    package: {
      weight: 5.0,
      dimensions: { length: 40, width: 30, height: 25 },
      description: 'Grocery items - Perishable',
      value: 45,
      pieces: 3,
    },
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 'SHP-003',
    trackingNumber: 'BHD-2024-001003',
    status: 'in_transit',
    serviceType: 'same_day',
    pickup: {
      name: 'Al Haram Jewelry',
      phone: '+973 3777 8888',
      address: 'Shop 3, Bab Al Bahrain Souk, Manama',
      lat: 26.2289,
      lng: 50.576,
    },
    delivery: {
      name: 'Ahmed Ibrahim',
      phone: '+973 3888 9999',
      address: 'Villa 12, Road 8, Block 429, Riffa',
      lat: 26.129,
      lng: 50.555,
    },
    package: {
      weight: 0.5,
      dimensions: { length: 15, width: 10, height: 5 },
      description: 'Jewelry - Gold watch',
      value: 1200,
      pieces: 1,
    },
    codAmount: 1200,
    notes: 'High value item - signature required',
    otp: '9521',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:30:00Z',
  },
  {
    id: 'SHP-004',
    trackingNumber: 'BHD-2024-001004',
    status: 'out_for_delivery',
    serviceType: 'express',
    pickup: {
      name: 'Tech World Store',
      phone: '+973 3999 0000',
      address: 'Level 2, City Centre Mall, Seef',
      lat: 26.235,
      lng: 50.542,
    },
    delivery: {
      name: 'Sara Mohammed',
      phone: '+973 3111 2222',
      address: 'Flat 4A, Building 7, Road 20, Sanabis',
      lat: 26.253,
      lng: 50.59,
      notes: 'Leave with security if not home',
    },
    package: {
      weight: 1.2,
      dimensions: { length: 25, width: 20, height: 10 },
      description: 'Laptop accessories',
      value: 85,
      pieces: 2,
    },
    otp: '7412',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
  {
    id: 'SHP-005',
    trackingNumber: 'BHD-2024-001005',
    status: 'delivered',
    serviceType: 'standard',
    pickup: {
      name: 'Bahrain Books',
      phone: '+973 3222 3333',
      address: 'Shop 5, Dana Mall, Sanabis',
      lat: 26.254,
      lng: 50.591,
    },
    delivery: {
      name: 'Khalid Al Noaimi',
      phone: '+973 3333 4444',
      address: 'House 18, Road 5, Block 712, Isa Town',
      lat: 26.165,
      lng: 50.538,
    },
    package: {
      weight: 3.0,
      dimensions: { length: 35, width: 25, height: 20 },
      description: 'Books and stationery',
      value: 35,
      pieces: 5,
    },
    completedAt: '2024-01-15T11:30:00Z',
    createdAt: '2024-01-15T07:00:00Z',
    updatedAt: '2024-01-15T11:30:00Z',
  },
];

const mockRoute: Route = {
  id: 'RTE-001',
  name: 'Manama Central Route',
  stops: [
    { id: 'S1', shipmentId: 'SHP-001', sequence: 1, lat: 26.2154, lng: 50.5832, address: 'Villa 45, Road 12, Block 338, Adliya', status: 'pending', estimatedArrival: '10:30 AM' },
    { id: 'S2', shipmentId: 'SHP-002', sequence: 2, lat: 26.2087, lng: 50.6075, address: 'Apartment 8B, Building 22, Road 15, Juffair', status: 'pending', estimatedArrival: '11:00 AM' },
    { id: 'S3', shipmentId: 'SHP-004', sequence: 3, lat: 26.253, lng: 50.59, address: 'Flat 4A, Building 7, Road 20, Sanabis', status: 'pending', estimatedArrival: '11:45 AM' },
    { id: 'S4', shipmentId: 'SHP-003', sequence: 4, lat: 26.129, lng: 50.555, address: 'Villa 12, Road 8, Block 429, Riffa', status: 'pending', estimatedArrival: '12:30 PM' },
  ],
  totalDistance: 28.5,
  estimatedTime: 120,
  status: 'active',
  startTime: '2024-01-15T08:00:00Z',
};

const mockEarnings: Earning[] = [
  { id: 'E001', date: '2024-01-15', shipmentId: 'SHP-005', trackingNumber: 'BHD-2024-001005', amount: 3.5, type: 'delivery_fee', status: 'paid' },
  { id: 'E002', date: '2024-01-15', shipmentId: 'SHP-003', trackingNumber: 'BHD-2024-001003', amount: 8.0, type: 'delivery_fee', status: 'pending' },
  { id: 'E003', date: '2024-01-15', shipmentId: 'SHP-004', trackingNumber: 'BHD-2024-001004', amount: 5.0, type: 'delivery_fee', status: 'pending' },
  { id: 'E004', date: '2024-01-15', shipmentId: 'BONUS', trackingNumber: '-', amount: 10.0, type: 'bonus', status: 'paid' },
  { id: 'E005', date: '2024-01-14', shipmentId: 'SHP-006', trackingNumber: 'BHD-2024-000999', amount: 4.0, type: 'delivery_fee', status: 'paid' },
  { id: 'E006', date: '2024-01-14', shipmentId: 'SHP-007', trackingNumber: 'BHD-2024-001000', amount: 4.0, type: 'delivery_fee', status: 'paid' },
  { id: 'E007', date: '2024-01-14', shipmentId: 'TIP', trackingNumber: '-', amount: 2.0, type: 'tip', status: 'paid' },
  { id: 'E008', date: '2024-01-13', shipmentId: 'SHP-008', trackingNumber: 'BHD-2024-000995', amount: 3.5, type: 'delivery_fee', status: 'paid' },
  { id: 'E009', date: '2024-01-13', shipmentId: 'SHP-009', trackingNumber: 'BHD-2024-000996', amount: 3.5, type: 'delivery_fee', status: 'paid' },
  { id: 'E010', date: '2024-01-13', shipmentId: 'SHP-010', trackingNumber: 'BHD-2024-000997', amount: 5.0, type: 'delivery_fee', status: 'paid' },
];

const mockDriverProfile: DriverProfile = {
  id: 'DRV-001',
  name: 'Ali Hassan',
  photo: 'https://randomuser.me/api/portraits/men/32.jpg',
  rating: 4.8,
  employeeId: 'BHD-DRV-1024',
  phone: '+973 3555 1234',
  email: 'ali.hassan@bhdlogistics.com',
  totalDeliveries: 2847,
  successRate: 98.5,
  distanceTraveled: 15620,
  vehicle: {
    type: 'Van',
    model: 'Toyota Hiace 2022',
    plateNumber: 'BHD-12345',
    color: 'White',
  },
  workSchedule: {
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    startTime: '08:00',
    endTime: '18:00',
  },
  documents: [
    { type: 'Driving License', number: 'DL-789456', expiryDate: '2025-06-15', verified: true },
    { type: 'CPR / ID', number: 'CPR-901234', expiryDate: '2027-03-20', verified: true },
    { type: 'Vehicle Registration', number: 'VR-123456', expiryDate: '2024-12-31', verified: true },
  ],
};

export const driverService = {
  async getTodayShipments(): Promise<Shipment[]> {
    await delay(MOCK_DELAY);
    return [...mockShipments];
  },

  async getShipmentDetail(id: string): Promise<Shipment | null> {
    await delay(MOCK_DELAY);
    return mockShipments.find(s => s.id === id) || null;
  },

  async updateShipmentStatus(id: string, status: ShipmentStatus): Promise<Shipment> {
    await delay(MOCK_DELAY);
    const shipment = mockShipments.find(s => s.id === id);
    if (!shipment) throw new Error('Shipment not found');
    shipment.status = status;
    shipment.updatedAt = new Date().toISOString();
    if (status === 'delivered') {
      shipment.completedAt = new Date().toISOString();
    }
    return { ...shipment };
  },

  async completeDelivery(
    id: string,
    data: DeliveryCompletionData,
  ): Promise<{ success: boolean; shipment: Shipment }> {
    await delay(MOCK_DELAY);
    const shipment = mockShipments.find(s => s.id === id);
    if (!shipment) throw new Error('Shipment not found');
    shipment.status = 'delivered';
    shipment.updatedAt = new Date().toISOString();
    shipment.completedAt = new Date().toISOString();
    shipment.codCollected = !!shipment.codAmount;
    return { success: true, shipment: { ...shipment } };
  },

  async verifyOtp(id: string, otp: string): Promise<{ valid: boolean }> {
    await delay(300);
    const shipment = mockShipments.find(s => s.id === id);
    if (!shipment) throw new Error('Shipment not found');
    return { valid: shipment.otp === otp };
  },

  async reportIssue(id: string, data: IssueReport): Promise<{ success: boolean }> {
    await delay(MOCK_DELAY);
    const shipment = mockShipments.find(s => s.id === id);
    if (!shipment) throw new Error('Shipment not found');
    shipment.status = 'failed';
    shipment.updatedAt = new Date().toISOString();
    console.log('Issue reported:', data);
    return { success: true };
  },

  async getEarnings(period: EarningPeriod): Promise<Earning[]> {
    await delay(MOCK_DELAY);
    const now = new Date('2024-01-15');
    return mockEarnings.filter(e => {
      const d = new Date(e.date);
      if (period === 'today') return e.date === '2024-01-15';
      if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo && d <= now;
      }
      if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return false;
    });
  },

  async toggleOnlineStatus(status: boolean): Promise<{ success: boolean; isOnline: boolean }> {
    await delay(300);
    return { success: true, isOnline: status };
  },

  async updateLocation(lat: number, lng: number): Promise<{ success: boolean }> {
    return { success: true };
  },

  async getCurrentRoute(): Promise<Route | null> {
    await delay(MOCK_DELAY);
    return { ...mockRoute };
  },

  async getDriverProfile(): Promise<DriverProfile> {
    await delay(MOCK_DELAY);
    return { ...mockDriverProfile };
  },

  async scanTrackingNumber(barcode: string): Promise<Shipment | null> {
    await delay(500);
    return mockShipments.find(s => s.trackingNumber === barcode) || null;
  },
};
