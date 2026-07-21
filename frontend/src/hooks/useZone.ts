"use client";

import { useQuery } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────

export interface Zone {
  id: string;
  name: string;
  code: string;
  coverage: number;
  pricingTier: "standard" | "premium" | "remote";
  shipments: number;
  drivers: number;
  avgDeliveryTime: number;
  active: boolean;
  parentZone?: string;
}

export interface ZoneCoverage {
  zoneId: string;
  coverage: number;
  postcodes: string[];
  population: number;
  area: number; // km²
}

// ─── Mock Data ───────────────────────────────────────────────────────

const mockZones: Zone[] = [
  {
    id: "z1",
    name: "Muscat Central",
    code: "MCT-01",
    coverage: 95,
    pricingTier: "standard",
    shipments: 4520,
    drivers: 18,
    avgDeliveryTime: 28,
    active: true,
  },
  {
    id: "z2",
    name: "Seeb Coastal",
    code: "SEB-01",
    coverage: 88,
    pricingTier: "standard",
    shipments: 3210,
    drivers: 12,
    avgDeliveryTime: 35,
    active: true,
  },
  {
    id: "z3",
    name: "Qurum West",
    code: "QUR-01",
    coverage: 92,
    pricingTier: "premium",
    shipments: 2890,
    drivers: 10,
    avgDeliveryTime: 22,
    active: true,
  },
  {
    id: "z4",
    name: "Bawshar South",
    code: "BAW-01",
    coverage: 78,
    pricingTier: "standard",
    shipments: 1870,
    drivers: 8,
    avgDeliveryTime: 42,
    active: true,
  },
  {
    id: "z5",
    name: "Sohar Industrial",
    code: "SOH-01",
    coverage: 65,
    pricingTier: "remote",
    shipments: 950,
    drivers: 5,
    avgDeliveryTime: 65,
    active: true,
  },
  {
    id: "z6",
    name: "Salalah Coastal",
    code: "SAL-01",
    coverage: 55,
    pricingTier: "remote",
    shipments: 680,
    drivers: 4,
    avgDeliveryTime: 80,
    active: true,
  },
];

const mockCoverage: Record<string, ZoneCoverage> = {
  z1: {
    zoneId: "z1",
    coverage: 95,
    postcodes: ["100", "101", "102", "103", "104", "105"],
    population: 250000,
    area: 150,
  },
  z2: {
    zoneId: "z2",
    coverage: 88,
    postcodes: ["200", "201", "202", "203", "204"],
    population: 180000,
    area: 200,
  },
  z3: {
    zoneId: "z3",
    coverage: 92,
    postcodes: ["300", "301", "302", "303"],
    population: 120000,
    area: 80,
  },
  z4: {
    zoneId: "z4",
    coverage: 78,
    postcodes: ["400", "401", "402", "403", "404"],
    population: 95000,
    area: 250,
  },
  z5: {
    zoneId: "z5",
    coverage: 65,
    postcodes: ["500", "501", "502"],
    population: 60000,
    area: 300,
  },
  z6: {
    zoneId: "z6",
    coverage: 55,
    postcodes: ["600", "601", "602"],
    population: 45000,
    area: 400,
  },
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── API Functions ───────────────────────────────────────────────────

async function fetchZones(): Promise<Zone[]> {
  await delay(300);
  return [...mockZones];
}

async function fetchZoneCoverage(zoneId: string): Promise<ZoneCoverage | null> {
  await delay(200);
  return mockCoverage[zoneId] || null;
}

// ─── Hooks ───────────────────────────────────────────────────────────

export function useZones() {
  return useQuery({
    queryKey: ["zones"],
    queryFn: fetchZones,
  });
}

export function useZoneCoverage(zoneId: string) {
  return useQuery({
    queryKey: ["zone-coverage", zoneId],
    queryFn: () => fetchZoneCoverage(zoneId),
    enabled: !!zoneId,
  });
}
