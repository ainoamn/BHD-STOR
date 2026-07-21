"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────

export interface Driver {
  id: string;
  name: string;
  employeeId: string;
  status: "active" | "offline" | "on_leave" | "suspended";
  phone: string;
  email: string;
  license: string;
  licenseExpiry: string;
  zone: string;
  rating: number;
  totalDeliveries: number;
  completedDeliveries: number;
  onTimeRate: number;
  totalEarnings: number;
  currentVehicleId?: string;
  currentVehicleName?: string;
  joinDate: string;
  address: string;
  nationality: string;
  dateOfBirth: string;
  emergencyContact: string;
}

export interface DriverFilters {
  status?: Driver["status"] | "all";
  zone?: string;
  minRating?: number;
  search?: string;
}

export interface CreateDriverData {
  name: string;
  phone: string;
  email: string;
  zone: string;
  license: string;
  address: string;
  nationality: string;
  dateOfBirth: string;
  emergencyContact: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────

const mockDrivers: Driver[] = [
  {
    id: "d1",
    name: "Khalid Bin Said",
    employeeId: "BHD-DRV-001",
    status: "active",
    phone: "+968 9555 1234",
    email: "khalid.said@bhd.om",
    license: "OM-DRV-2019-001",
    licenseExpiry: "2026-03-15",
    zone: "Muscat",
    rating: 4.8,
    totalDeliveries: 1247,
    completedDeliveries: 1195,
    onTimeRate: 94.2,
    totalEarnings: 18450,
    currentVehicleId: "v1",
    currentVehicleName: "Toyota Hilux (OM-1234)",
    joinDate: "2021-03-15",
    address: "House 12, Block 3, Al Khuwair",
    nationality: "Omani",
    dateOfBirth: "1990-06-20",
    emergencyContact: "+968 9555 9999",
  },
  {
    id: "d2",
    name: "Said Al-Habsi",
    employeeId: "BHD-DRV-002",
    status: "active",
    phone: "+968 9555 5678",
    email: "said.habsi@bhd.om",
    license: "OM-DRV-2020-002",
    licenseExpiry: "2027-01-10",
    zone: "Seeb",
    rating: 4.5,
    totalDeliveries: 982,
    completedDeliveries: 920,
    onTimeRate: 91.5,
    totalEarnings: 14200,
    currentVehicleId: "v2",
    currentVehicleName: "Nissan Urvan (OM-5678)",
    joinDate: "2022-01-10",
    address: "Villa 8, Al Hail South",
    nationality: "Omani",
    dateOfBirth: "1988-03-12",
    emergencyContact: "+968 9555 8888",
  },
  {
    id: "d3",
    name: "Hamdan Al-Azri",
    employeeId: "BHD-DRV-003",
    status: "active",
    phone: "+968 9555 9012",
    email: "hamdan.azri@bhd.om",
    license: "OM-DRV-2021-003",
    licenseExpiry: "2028-06-01",
    zone: "Qurum",
    rating: 4.9,
    totalDeliveries: 756,
    completedDeliveries: 735,
    onTimeRate: 97.1,
    totalEarnings: 11200,
    currentVehicleId: "v3",
    currentVehicleName: "Honda Activa (OM-9012)",
    joinDate: "2023-06-01",
    address: "Flat 15, Qurum Commercial",
    nationality: "Omani",
    dateOfBirth: "1995-11-05",
    emergencyContact: "+968 9555 7777",
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── API Functions ───────────────────────────────────────────────────

async function fetchDrivers(filters?: DriverFilters): Promise<Driver[]> {
  await delay(300);
  let data = [...mockDrivers];
  if (filters?.status && filters.status !== "all") {
    data = data.filter((d) => d.status === filters.status);
  }
  if (filters?.zone) {
    data = data.filter((d) => d.zone === filters.zone);
  }
  if (filters?.minRating) {
    data = data.filter((d) => d.rating >= filters.minRating!);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.employeeId.toLowerCase().includes(q)
    );
  }
  return data;
}

async function fetchDriver(id: string): Promise<Driver | undefined> {
  await delay(200);
  return mockDrivers.find((d) => d.id === id);
}

async function fetchDriverPerformance(id: string) {
  await delay(200);
  const driver = mockDrivers.find((d) => d.id === id);
  if (!driver) return null;
  return {
    monthlyStats: [
      { month: "Aug 2024", deliveries: 93, earnings: 1320, bonus: 125, onTime: 95 },
      { month: "Sep 2024", deliveries: 88, earnings: 1180, bonus: 50, onTime: 92 },
      { month: "Oct 2024", deliveries: 101, earnings: 1450, bonus: 200, onTime: 96 },
      { month: "Nov 2024", deliveries: 82, earnings: 1100, bonus: 75, onTime: 90 },
      { month: "Dec 2024", deliveries: 95, earnings: 1380, bonus: 150, onTime: 94 },
      { month: "Jan 2025", deliveries: 89, earnings: 1250, bonus: 100, onTime: 93 },
    ],
    ratingBreakdown: [
      { stars: 5, count: 534 },
      { stars: 4, count: 312 },
      { stars: 3, count: 89 },
      { stars: 2, count: 34 },
      { stars: 1, count: 12 },
    ],
    peakHours: [
      { hour: "8-10", deliveries: 145 },
      { hour: "10-12", deliveries: 230 },
      { hour: "12-14", deliveries: 180 },
      { hour: "14-16", deliveries: 195 },
      { hour: "16-18", deliveries: 210 },
    ],
  };
}

async function createDriverAPI(data: CreateDriverData): Promise<Driver> {
  await delay(500);
  const newDriver: Driver = {
    id: `d${mockDrivers.length + 1}`,
    employeeId: `BHD-DRV-00${mockDrivers.length + 1}`,
    name: data.name,
    status: "active",
    phone: data.phone,
    email: data.email,
    license: data.license,
    licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    zone: data.zone,
    rating: 5.0,
    totalDeliveries: 0,
    completedDeliveries: 0,
    onTimeRate: 100,
    totalEarnings: 0,
    joinDate: new Date().toISOString().split("T")[0],
    address: data.address,
    nationality: data.nationality,
    dateOfBirth: data.dateOfBirth,
    emergencyContact: data.emergencyContact,
  };
  mockDrivers.push(newDriver);
  return newDriver;
}

async function updateDriverAPI(id: string, data: Partial<Driver>) {
  await delay(300);
  const driver = mockDrivers.find((d) => d.id === id);
  if (driver) {
    Object.assign(driver, data);
  }
  return driver;
}

// ─── Hooks ───────────────────────────────────────────────────────────

export function useDrivers(filters?: DriverFilters) {
  return useQuery({
    queryKey: ["drivers", filters],
    queryFn: () => fetchDrivers(filters),
  });
}

export function useDriver(id: string) {
  return useQuery({
    queryKey: ["driver", id],
    queryFn: () => fetchDriver(id),
    enabled: !!id,
  });
}

export function useDriverPerformance(id: string) {
  return useQuery({
    queryKey: ["driver-performance", id],
    queryFn: () => fetchDriverPerformance(id),
    enabled: !!id,
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDriverAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Driver> }) =>
      updateDriverAPI(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["driver", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}
