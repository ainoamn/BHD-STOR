"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────

export interface Shipment {
  id: string;
  trackingNumber: string;
  sender: {
    name: string;
    phone: string;
    address: string;
    lat: number;
    lng: number;
  };
  receiver: {
    name: string;
    phone: string;
    address: string;
    lat: number;
    lng: number;
  };
  package: {
    weight: number;
    length: number;
    width: number;
    height: number;
    pieces: number;
    value: number;
    description: string;
  };
  status: "pending" | "in_transit" | "out_for_delivery" | "delivered" | "failed" | "cancelled";
  serviceType: "standard" | "express" | "same_day" | "next_day";
  driverId?: string;
  driverName?: string;
  zone: string;
  cost: number;
  codAmount?: number;
  createdAt: string;
  updatedAt: string;
  timeline: Array<{
    status: string;
    timestamp: string;
    location: string;
    completed: boolean;
  }>;
}

export interface ShipmentFilters {
  status?: Shipment["status"] | "all";
  search?: string;
  zone?: string;
  dateFrom?: string;
  dateTo?: string;
  driverId?: string;
}

export interface CreateShipmentData {
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderLat: number;
  senderLng: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverLat: number;
  receiverLng: number;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  pieces: number;
  value: number;
  description?: string;
  serviceType: string;
  codAmount?: number;
}

// ─── Mock API ────────────────────────────────────────────────────────

const mockShipments: Shipment[] = [
  {
    id: "1",
    trackingNumber: "TRK-2847",
    sender: { name: "Oman Electronics LLC", phone: "+968 9123 4567", address: "Building 47, Al Khuwair", lat: 23.588, lng: 58.3829 },
    receiver: { name: "Ahmed Al-Farsi", phone: "+968 9876 5432", address: "Villa 12, Al Shatti, Qurum", lat: 23.6156, lng: 58.4731 },
    package: { weight: 3.5, length: 30, width: 20, height: 15, pieces: 1, value: 150, description: "Electronic components" },
    status: "in_transit",
    serviceType: "express",
    driverId: "d1",
    driverName: "Khalid Bin Said",
    zone: "Muscat",
    cost: 12.5,
    createdAt: "2025-01-15T08:30:00Z",
    updatedAt: "2025-01-15T10:30:00Z",
    timeline: [
      { status: "Created", timestamp: "2025-01-15T08:30:00Z", location: "Muscat Hub", completed: true },
      { status: "Picked Up", timestamp: "2025-01-15T09:15:00Z", location: "Al Khuwair", completed: true },
      { status: "In Transit", timestamp: "2025-01-15T10:30:00Z", location: "En route", completed: true },
    ],
  },
  {
    id: "2",
    trackingNumber: "TRK-2848",
    sender: { name: "Home Style Furniture", phone: "+968 9234 5678", address: "Way 3240, Ghala", lat: 23.577, lng: 58.3929 },
    receiver: { name: "Fatima Al-Balushi", phone: "+968 9765 4321", address: "House 5, Al Hail, Seeb", lat: 23.6556, lng: 58.2931 },
    package: { weight: 12.0, length: 120, width: 60, height: 40, pieces: 2, value: 450, description: "Dining table set" },
    status: "out_for_delivery",
    serviceType: "standard",
    driverId: "d2",
    driverName: "Said Al-Habsi",
    zone: "Seeb",
    cost: 8.0,
    codAmount: 0,
    createdAt: "2025-01-15T09:15:00Z",
    updatedAt: "2025-01-15T11:00:00Z",
    timeline: [
      { status: "Created", timestamp: "2025-01-15T09:15:00Z", location: "Muscat Hub", completed: true },
      { status: "Picked Up", timestamp: "2025-01-15T10:00:00Z", location: "Ghala", completed: true },
      { status: "Out for Delivery", timestamp: "2025-01-15T11:00:00Z", location: "Al Hail", completed: true },
    ],
  },
  {
    id: "3",
    trackingNumber: "TRK-2849",
    sender: { name: "Fresh Foods Market", phone: "+968 9345 6789", address: "Shop 12, Ruwi High Street", lat: 23.598, lng: 58.4129 },
    receiver: { name: "Mohammed Al-Riyami", phone: "+968 9654 3210", address: "Flat 8, Al Amerat", lat: 23.5156, lng: 58.4731 },
    package: { weight: 1.2, length: 20, width: 15, height: 10, pieces: 1, value: 25, description: "Fresh groceries" },
    status: "delivered",
    serviceType: "same_day",
    driverId: "d3",
    driverName: "Hamdan Al-Azri",
    zone: "Al Amerat",
    cost: 15.0,
    createdAt: "2025-01-15T07:00:00Z",
    updatedAt: "2025-01-15T12:30:00Z",
    timeline: [
      { status: "Created", timestamp: "2025-01-15T07:00:00Z", location: "Muscat Hub", completed: true },
      { status: "Picked Up", timestamp: "2025-01-15T07:30:00Z", location: "Ruwi", completed: true },
      { status: "Delivered", timestamp: "2025-01-15T12:30:00Z", location: "Al Amerat", completed: true },
    ],
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── API Functions ───────────────────────────────────────────────────

async function fetchShipments(filters?: ShipmentFilters): Promise<Shipment[]> {
  await delay(300);
  let data = [...mockShipments];
  if (filters?.status && filters.status !== "all") {
    data = data.filter((s) => s.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (s) =>
        s.trackingNumber.toLowerCase().includes(q) ||
        s.sender.name.toLowerCase().includes(q) ||
        s.receiver.name.toLowerCase().includes(q)
    );
  }
  if (filters?.zone) {
    data = data.filter((s) => s.zone === filters.zone);
  }
  if (filters?.driverId) {
    data = data.filter((s) => s.driverId === filters.driverId);
  }
  return data;
}

async function fetchShipment(id: string): Promise<Shipment | undefined> {
  await delay(200);
  return mockShipments.find((s) => s.id === id);
}

async function createShipmentAPI(data: CreateShipmentData): Promise<Shipment> {
  await delay(500);
  const newShipment: Shipment = {
    id: String(mockShipments.length + 1),
    trackingNumber: `TRK-${2847 + mockShipments.length}`,
    sender: { name: data.senderName, phone: data.senderPhone, address: data.senderAddress, lat: data.senderLat, lng: data.senderLng },
    receiver: { name: data.receiverName, phone: data.receiverPhone, address: data.receiverAddress, lat: data.receiverLat, lng: data.receiverLng },
    package: { weight: data.weight, length: data.length || 0, width: data.width || 0, height: data.height || 0, pieces: data.pieces, value: data.value, description: data.description || "" },
    status: "pending",
    serviceType: data.serviceType as any,
    zone: "Muscat",
    cost: data.weight * 1.5 + 5,
    codAmount: data.codAmount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [{ status: "Created", timestamp: new Date().toISOString(), location: "Muscat Hub", completed: true }],
  };
  mockShipments.push(newShipment);
  return newShipment;
}

async function updateShipmentStatusAPI(id: string, status: Shipment["status"]) {
  await delay(300);
  const shipment = mockShipments.find((s) => s.id === id);
  if (shipment) {
    shipment.status = status;
    shipment.updatedAt = new Date().toISOString();
    shipment.timeline.push({ status, timestamp: new Date().toISOString(), location: "Updated", completed: true });
  }
  return shipment;
}

async function assignDriverAPI(shipmentId: string, driverId: string) {
  await delay(300);
  const shipment = mockShipments.find((s) => s.id === shipmentId);
  if (shipment) {
    shipment.driverId = driverId;
    shipment.driverName = driverId === "d1" ? "Khalid Bin Said" : driverId === "d2" ? "Said Al-Habsi" : "Hamdan Al-Azri";
    shipment.status = "in_transit";
    shipment.updatedAt = new Date().toISOString();
  }
  return shipment;
}

async function trackShipmentAPI(trackingNumber: string): Promise<Shipment | undefined> {
  await delay(200);
  return mockShipments.find((s) => s.trackingNumber === trackingNumber);
}

// ─── Hooks ───────────────────────────────────────────────────────────

export function useShipments(filters?: ShipmentFilters) {
  return useQuery({
    queryKey: ["shipments", filters],
    queryFn: () => fetchShipments(filters),
  });
}

export function useShipment(id: string) {
  return useQuery({
    queryKey: ["shipment", id],
    queryFn: () => fetchShipment(id),
    enabled: !!id,
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createShipmentAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
}

export function useUpdateShipmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Shipment["status"] }) =>
      updateShipmentStatusAPI(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shipment", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shipmentId, driverId }: { shipmentId: string; driverId: string }) =>
      assignDriverAPI(shipmentId, driverId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shipment", variables.shipmentId] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
}

export function useTrackShipment() {
  return useMutation({
    mutationFn: trackShipmentAPI,
  });
}
