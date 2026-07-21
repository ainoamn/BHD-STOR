"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────

export interface PricingRule {
  id: string;
  name: string;
  fromZone: string;
  toZone: string;
  serviceType: "Standard" | "Express" | "Same Day" | "Next Day";
  baseRate: number;
  weightRate: number;
  minCharge: number;
  maxWeight: number;
  codFee: number;
  vatRate: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PriceCalculationData {
  weight: number;
  fromZone: string;
  toZone: string;
  serviceType: string;
  codEnabled: boolean;
  declaredValue?: number;
}

export interface PriceCalculationResult {
  baseRate: number;
  weightCharge: number;
  serviceCharge: number;
  subtotal: number;
  vat: number;
  codFee: number;
  total: number;
  breakdown: Array<{ label: string; amount: number }>;
}

// ─── Mock Data ───────────────────────────────────────────────────────

const mockPricingRules: PricingRule[] = [
  {
    id: "pr1",
    name: "Muscat-Seeb Standard",
    fromZone: "Muscat",
    toZone: "Seeb",
    serviceType: "Standard",
    baseRate: 3.0,
    weightRate: 1.5,
    minCharge: 2.0,
    maxWeight: 50,
    codFee: 1.0,
    vatRate: 0.05,
    active: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-12-01",
  },
  {
    id: "pr2",
    name: "Muscat-Qurum Express",
    fromZone: "Muscat",
    toZone: "Qurum",
    serviceType: "Express",
    baseRate: 5.0,
    weightRate: 2.0,
    minCharge: 4.0,
    maxWeight: 30,
    codFee: 1.0,
    vatRate: 0.05,
    active: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-11-15",
  },
  {
    id: "pr3",
    name: "Same Day - All Muscat",
    fromZone: "Muscat",
    toZone: "Muscat",
    serviceType: "Same Day",
    baseRate: 10.0,
    weightRate: 3.0,
    minCharge: 8.0,
    maxWeight: 20,
    codFee: 2.0,
    vatRate: 0.05,
    active: true,
    createdAt: "2024-03-01",
    updatedAt: "2024-10-20",
  },
  {
    id: "pr4",
    name: "Remote - Sohar",
    fromZone: "Muscat",
    toZone: "Sohar",
    serviceType: "Standard",
    baseRate: 8.0,
    weightRate: 2.5,
    minCharge: 6.0,
    maxWeight: 100,
    codFee: 1.5,
    vatRate: 0.05,
    active: true,
    createdAt: "2024-02-01",
    updatedAt: "2024-09-10",
  },
  {
    id: "pr5",
    name: "Next Day - Bawshar",
    fromZone: "Muscat",
    toZone: "Bawshar",
    serviceType: "Next Day",
    baseRate: 7.0,
    weightRate: 2.0,
    minCharge: 5.0,
    maxWeight: 50,
    codFee: 1.0,
    vatRate: 0.05,
    active: false,
    createdAt: "2024-06-01",
    updatedAt: "2024-12-20",
  },
];

const zoneDistanceMultipliers: Record<string, number> = {
  "muscat-seeb": 1.0,
  "muscat-qurum": 1.0,
  "muscat-bawshar": 1.2,
  "muscat-sohar": 2.5,
  "muscat-salalah": 4.0,
  "seeb-qurum": 1.1,
  "seeb-bawshar": 1.3,
  "seeb-muscat": 1.0,
  "qurum-muscat": 1.0,
  "qurum-seeb": 1.1,
  "bawshar-muscat": 1.2,
  "bawshar-seeb": 1.3,
  "sohar-muscat": 2.5,
  "salalah-muscat": 4.0,
};

const serviceMultipliers: Record<string, number> = {
  standard: 1.0,
  express: 1.8,
  "same_day": 3.5,
  "next_day": 2.2,
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── API Functions ───────────────────────────────────────────────────

async function fetchPricingRules(): Promise<PricingRule[]> {
  await delay(300);
  return [...mockPricingRules];
}

async function calculatePriceAPI(data: PriceCalculationData): Promise<PriceCalculationResult> {
  await delay(200);

  const zoneKey = `${data.fromZone.toLowerCase()}-${data.toZone.toLowerCase()}`;
  const zoneMultiplier = zoneDistanceMultipliers[zoneKey] || 1.5;
  const serviceMult = serviceMultipliers[data.serviceType.toLowerCase()] || 1.0;

  const baseRate = 3.0 * serviceMult;
  const weightCharge = data.weight * 1.5 * zoneMultiplier;
  const serviceCharge = baseRate * 0.4;
  const subtotal = baseRate + weightCharge + serviceCharge;
  const vat = subtotal * 0.05;
  const codFee = data.codEnabled ? 1.0 : 0;
  const total = subtotal + vat + codFee;

  return {
    baseRate,
    weightCharge,
    serviceCharge,
    subtotal,
    vat,
    codFee,
    total,
    breakdown: [
      { label: "Base Rate", amount: baseRate },
      { label: `Weight Charge (${data.weight} kg)`, amount: weightCharge },
      { label: "Service Charge", amount: serviceCharge },
      { label: "VAT (5%)", amount: vat },
      ...(data.codEnabled ? [{ label: "COD Fee", amount: codFee }] : []),
    ],
  };
}

async function createPricingRuleAPI(data: Omit<PricingRule, "id" | "createdAt" | "updatedAt">): Promise<PricingRule> {
  await delay(500);
  const newRule: PricingRule = {
    ...data,
    id: `pr${mockPricingRules.length + 1}`,
    createdAt: new Date().toISOString().split("T")[0],
    updatedAt: new Date().toISOString().split("T")[0],
  };
  mockPricingRules.push(newRule);
  return newRule;
}

async function updatePricingRuleAPI(id: string, data: Partial<PricingRule>) {
  await delay(300);
  const rule = mockPricingRules.find((r) => r.id === id);
  if (rule) {
    Object.assign(rule, data, { updatedAt: new Date().toISOString().split("T")[0] });
  }
  return rule;
}

// ─── Hooks ───────────────────────────────────────────────────────────

export function usePricingRules() {
  return useQuery({
    queryKey: ["pricing-rules"],
    queryFn: fetchPricingRules,
  });
}

export function useCalculatePrice() {
  return useMutation({
    mutationFn: calculatePriceAPI,
  });
}

export function useCreatePricingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPricingRuleAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });
    },
  });
}

export function useUpdatePricingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PricingRule> }) =>
      updatePricingRuleAPI(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });
    },
  });
}
