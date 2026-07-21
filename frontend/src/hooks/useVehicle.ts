"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  type: "truck" | "van" | "bike" | "car";
  status: "active" | "maintenance" | "inactive";
  brand: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  capacity: string;
  fuelType: string;
  mileage: number;
  fuelLevel: number;
  currentDriverId?: string;
  currentDriverName?: string;
  zone: string;
  lastMaintenance: string;
  nextMaintenance: string;
  insuranceExpiry: string;
  registrationExpiry: string;
}

export interface VehicleFilters {
  type?: Vehicle["type"] | "all";
  status?: Vehicle["status"] | "all";
  zone?: string;
  search?: string;
}

export interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  inMaintenance: number;
  inactive: number;
  utilization: number;
  onTimeRate: number;
  totalDistance: number;
  avgFuelLevel: number;
  upcomingMaintenance: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────

const mockVehicles: Vehicle[] = [
  {
    id: "v1",
    name: "Toyota Hilux",
    plateNumber: "OM-1234",
    type: "truck",
    status: "active",
    brand: "Toyota",
    model: "Hilux",
    year: 2023,
    color: "White",
    vin: "JTFLU71J9B5023456",
    capacity: "1,000 kg",
    fuelType: "Diesel",
    mileage: 45230,
    fuelLevel: 75,
    currentDriverId: "d1",
    currentDriverName: "Khalid Bin Said",
    zone: "Muscat",
    lastMaintenance: "2024-12-01",
    nextMaintenance: "2025-02-01",
    insuranceExpiry: "2025-06-15",
    registrationExpiry: "2025-09-20",
  },
  {
    id: "v2",
    name: "Nissan Urvan",
    plateNumber: "OM-5678",
    type: "van",
    status: "active",
    brand: "Nissan",
    model: "Urvan",
    year: 2022,
    color: "Silver",
    vin: "JN6AP6DN1BX012345",
    capacity: "800 kg",
    fuelType: "Diesel",
    mileage: 32150,
    fuelLevel: 60,
    currentDriverId: "d2",
    currentDriverName: "Said Al-Habsi",
    zone: "Seeb",
    lastMaintenance: "2025-01-05",
    nextMaintenance: "2025-03-05",
    insuranceExpiry: "2025-08-20",
    registrationExpiry: "2025-11-15",
  },
  {
    id: "v3",
    name: "Honda Activa",
    plateNumber: "OM-9012",
    type: "bike",
    status: "active",
    brand: "Honda",
    model: "Activa",
    year: 2024,
    color: "Red",
    vin: "ME4JF50B8NJ123456",
    capacity: "30 kg",
    fuelType: "Petrol",
    mileage: 12500,
    fuelLevel: 90,
    currentDriverId: "d3",
    currentDriverName: "Hamdan Al-Azri",
    zone: "Qurum",
    lastMaintenance: "2025-01-10",
    nextMaintenance: "2025-04-10",
    insuranceExpiry: "2025-12-31",
    registrationExpiry: "2026-01-15",
  },
  {
    id: "v4",
    name: "Mitsubishi Canter",
    plateNumber: "OM-3456",
    type: "truck",
    status: "maintenance",
    brand: "Mitsubishi",
    model: "Canter",
    year: 2021,
    color: "Blue",
    vin: "JL6BNE1A1BK234567",
    capacity: "3,000 kg",
    fuelType: "Diesel",
    mileage: 67800,
    fuelLevel: 20,
    zone: "Bawshar",
    lastMaintenance: "2024-11-15",
    nextMaintenance: "2025-01-15",
    insuranceExpiry: "2025-04-30",
    registrationExpiry: "2025-07-10",
  },
];

const fleetStats: FleetStats = {
  totalVehicles: 40,
  activeVehicles: 32,
  inMaintenance: 4,
  inactive: 4,
  utilization: 87,
  onTimeRate: 93,
  totalDistance: 156000,
  avgFuelLevel: 68,
  upcomingMaintenance: 3,
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── API Functions ───────────────────────────────────────────────────

async function fetchVehicles(filters?: VehicleFilters): Promise<Vehicle[]> {
  await delay(300);
  let data = [...mockVehicles];
  if (filters?.type && filters.type !== "all") {
    data = data.filter((v) => v.type === filters.type);
  }
  if (filters?.status && filters.status !== "all") {
    data = data.filter((v) => v.status === filters.status);
  }
  if (filters?.zone) {
    data = data.filter((v) => v.zone === filters.zone);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.plateNumber.toLowerCase().includes(q)
    );
  }
  return data;
}

async function fetchVehicle(id: string): Promise<Vehicle | undefined> {
  await delay(200);
  return mockVehicles.find((v) => v.id === id);
}

async function fetchFleetStats(): Promise<FleetStats> {
  await delay(200);
  return { ...fleetStats };
}

async function createVehicleAPI(data: any): Promise<Vehicle> {
  await delay(500);
  const newVehicle: Vehicle = {
    id: `v${mockVehicles.length + 1}`,
    name: data.name || "New Vehicle",
    plateNumber: data.plateNumber || "OM-0000",
    type: data.type || "car",
    status: "active",
    brand: data.brand || "",
    model: data.model || "",
    year: data.year || 2024,
    color: data.color || "White",
    vin: data.vin || "",
    capacity: data.capacity || "500 kg",
    fuelType: data.fuelType || "Petrol",
    mileage: 0,
    fuelLevel: 100,
    zone: data.zone || "Muscat",
    lastMaintenance: new Date().toISOString().split("T")[0],
    nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  };
  mockVehicles.push(newVehicle);
  return newVehicle;
}

async function assignDriverAPI(vehicleId: string, driverId: string) {
  await delay(300);
  const vehicle = mockVehicles.find((v) => v.id === vehicleId);
  if (vehicle) {
    vehicle.currentDriverId = driverId;
    vehicle.currentDriverName = driverId === "d1" ? "Khalid Bin Said" : driverId === "d2" ? "Said Al-Habsi" : "Hamdan Al-Azri";
  }
  return vehicle;
}

// ─── Hooks ───────────────────────────────────────────────────────────

export function useVehicles(filters?: VehicleFilters) {
  return useQuery({
    queryKey: ["vehicles", filters],
    queryFn: () => fetchVehicles(filters),
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => fetchVehicle(id),
    enabled: !!id,
  });
}

export function useFleetStats() {
  return useQuery({
    queryKey: ["fleet-stats"],
    queryFn: fetchFleetStats,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVehicleAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
    },
  });
}

export function useAssignDriverToVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, driverId }: { vehicleId: string; driverId: string }) =>
      assignDriverAPI(vehicleId, driverId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vehicle", variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}
