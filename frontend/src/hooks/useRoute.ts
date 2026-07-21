"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────

export interface Route {
  id: string;
  name: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleName: string;
  date: string;
  stops: Array<{
    id: string;
    shipmentId: string;
    address: string;
    type: "pickup" | "delivery";
    status: "pending" | "completed" | "in_progress";
    lat: number;
    lng: number;
    estimatedTime: string;
  }>;
  status: "planned" | "active" | "completed" | "cancelled";
  distance: number;
  estimatedTime: number;
  actualTime?: number;
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

export interface RouteFilters {
  status?: Route["status"] | "all";
  date?: string;
  driverId?: string;
  zone?: string;
}

export interface CreateRouteData {
  name: string;
  driverId: string;
  vehicleId: string;
  date: string;
  shipmentIds: string[];
}

// ─── Mock Data ───────────────────────────────────────────────────────

const mockRoutes: Route[] = [
  {
    id: "R-452",
    name: "Muscat Central Route",
    driverId: "d1",
    driverName: "Khalid Bin Said",
    vehicleId: "v1",
    vehicleName: "Toyota Hilux (OM-1234)",
    date: "2025-01-15",
    stops: [
      { id: "s1", shipmentId: "TRK-2847", address: "Al Khuwair - Oman Electronics", type: "pickup", status: "completed", lat: 23.588, lng: 58.3829, estimatedTime: "08:30" },
      { id: "s2", shipmentId: "TRK-2847", address: "Qurum - Villa 12, Al Shatti", type: "delivery", status: "completed", lat: 23.6156, lng: 58.4731, estimatedTime: "09:30" },
      { id: "s3", shipmentId: "TRK-2862", address: "Ruwi - Al Harthy Complex", type: "pickup", status: "completed", lat: 23.598, lng: 58.4129, estimatedTime: "10:00" },
      { id: "s4", shipmentId: "TRK-2862", address: "Madinat SQ - Flat 55", type: "delivery", status: "in_progress", lat: 23.5256, lng: 58.4731, estimatedTime: "11:15" },
      { id: "s5", shipmentId: "TRK-2850", address: "Bawshar - Bawshar Heights", type: "pickup", status: "pending", lat: 23.548, lng: 58.3529, estimatedTime: "11:45" },
    ],
    status: "active",
    distance: 42.5,
    estimatedTime: 240,
    actualTime: 210,
    startTime: "08:00",
    createdAt: "2025-01-14T18:00:00Z",
  },
  {
    id: "R-453",
    name: "Seeb Coastal Route",
    driverId: "d2",
    driverName: "Said Al-Habsi",
    vehicleId: "v2",
    vehicleName: "Nissan Urvan (OM-5678)",
    date: "2025-01-15",
    stops: [
      { id: "s1", shipmentId: "TRK-2848", address: "Ghala - Home Style Furniture", type: "pickup", status: "completed", lat: 23.577, lng: 58.3929, estimatedTime: "08:45" },
      { id: "s2", shipmentId: "TRK-2848", address: "Al Hail - House 5", type: "delivery", status: "completed", lat: 23.6556, lng: 58.2931, estimatedTime: "09:30" },
    ],
    status: "completed",
    distance: 35.2,
    estimatedTime: 180,
    actualTime: 165,
    startTime: "08:30",
    endTime: "11:15",
    createdAt: "2025-01-14T18:00:00Z",
  },
  {
    id: "R-454",
    name: "Qurum Express Route",
    driverId: "d3",
    driverName: "Hamdan Al-Azri",
    vehicleId: "v3",
    vehicleName: "Honda Activa (OM-9012)",
    date: "2025-01-15",
    stops: [
      { id: "s1", shipmentId: "TRK-2853", address: "Qurum - Carrefour", type: "pickup", status: "completed", lat: 23.6256, lng: 58.4431, estimatedTime: "09:00" },
      { id: "s2", shipmentId: "TRK-2863", address: "Muttrah - Souk Area", type: "pickup", status: "completed", lat: 23.6156, lng: 58.5631, estimatedTime: "09:30" },
      { id: "s3", shipmentId: "TRK-2853", address: "Ghala - Lulu", type: "delivery", status: "in_progress", lat: 23.577, lng: 58.3929, estimatedTime: "10:15" },
    ],
    status: "active",
    distance: 18.7,
    estimatedTime: 300,
    actualTime: 120,
    startTime: "09:00",
    createdAt: "2025-01-14T18:00:00Z",
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── API Functions ───────────────────────────────────────────────────

async function fetchRoutes(filters?: RouteFilters): Promise<Route[]> {
  await delay(300);
  let data = [...mockRoutes];
  if (filters?.status && filters.status !== "all") {
    data = data.filter((r) => r.status === filters.status);
  }
  if (filters?.date) {
    data = data.filter((r) => r.date === filters.date);
  }
  if (filters?.driverId) {
    data = data.filter((r) => r.driverId === filters.driverId);
  }
  return data;
}

async function fetchRoute(id: string): Promise<Route | undefined> {
  await delay(200);
  return mockRoutes.find((r) => r.id === id);
}

async function createRouteAPI(data: CreateRouteData): Promise<Route> {
  await delay(500);
  const newRoute: Route = {
    id: `R-${452 + mockRoutes.length}`,
    name: data.name,
    driverId: data.driverId,
    driverName: data.driverId === "d1" ? "Khalid Bin Said" : data.driverId === "d2" ? "Said Al-Habsi" : "Hamdan Al-Azri",
    vehicleId: data.vehicleId,
    vehicleName: data.vehicleId === "v1" ? "Toyota Hilux" : data.vehicleId === "v2" ? "Nissan Urvan" : "Honda Activa",
    date: data.date,
    stops: data.shipmentIds.map((sid, i) => ({
      id: `s${i + 1}`,
      shipmentId: sid,
      address: `Stop ${i + 1}`,
      type: "delivery" as const,
      status: "pending" as const,
      lat: 23.588 + Math.random() * 0.1,
      lng: 58.3829 + Math.random() * 0.1,
      estimatedTime: `${9 + i}:00`,
    })),
    status: "planned",
    distance: Math.round(20 + Math.random() * 40),
    estimatedTime: Math.round(120 + Math.random() * 180),
    createdAt: new Date().toISOString(),
  };
  mockRoutes.push(newRoute);
  return newRoute;
}

async function optimizeRouteAPI(routeId: string) {
  await delay(2000);
  const route = mockRoutes.find((r) => r.id === routeId);
  if (route) {
    route.distance = Math.round(route.distance * 0.85);
    route.estimatedTime = Math.round(route.estimatedTime * 0.82);
  }
  return route;
}

async function updateRouteStatusAPI(id: string, status: Route["status"]) {
  await delay(300);
  const route = mockRoutes.find((r) => r.id === id);
  if (route) {
    route.status = status;
    if (status === "active" && !route.startTime) {
      route.startTime = new Date().toLocaleTimeString("en-OM", { hour: "2-digit", minute: "2-digit" });
    }
    if (status === "completed") {
      route.endTime = new Date().toLocaleTimeString("en-OM", { hour: "2-digit", minute: "2-digit" });
    }
  }
  return route;
}

// ─── Hooks ───────────────────────────────────────────────────────────

export function useRoutes(filters?: RouteFilters) {
  return useQuery({
    queryKey: ["routes", filters],
    queryFn: () => fetchRoutes(filters),
  });
}

export function useRoute(id: string) {
  return useQuery({
    queryKey: ["route", id],
    queryFn: () => fetchRoute(id),
    enabled: !!id,
  });
}

export function useCreateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRouteAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}

export function useOptimizeRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: optimizeRouteAPI,
    onSuccess: (_, routeId) => {
      queryClient.invalidateQueries({ queryKey: ["route", routeId] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}

export function useUpdateRouteStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Route["status"] }) =>
      updateRouteStatusAPI(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["route", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}
