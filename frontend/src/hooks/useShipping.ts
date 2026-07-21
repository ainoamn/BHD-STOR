import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { shippingService } from '@/services/shipping.service';
import type {
  ShippingRate,
  ShippingRateRequest,
  Shipment,
  CreateShipmentData,
  TrackingInfo,
  Carrier,
} from '@/services/shipping.service';

// ------------------------------------------------------------------
// Query Keys
// ------------------------------------------------------------------
export const shippingKeys = {
  all: ['shipping'] as const,
  rates: () => [...shippingKeys.all, 'rates'] as const,
  rate: (data: ShippingRateRequest) =>
    [...shippingKeys.rates(), data] as const,
  tracking: (trackingNumber: string, carrier?: string) =>
    [...shippingKeys.all, 'tracking', trackingNumber, carrier ?? ''] as const,
  carriers: () => [...shippingKeys.all, 'carriers'] as const,
  shipments: () => [...shippingKeys.all, 'shipments'] as const,
};

// ------------------------------------------------------------------
// Type Helpers
// ------------------------------------------------------------------
interface ShippingRateData {
  origin: {
    country: string;
    city: string;
    postalCode?: string;
  };
  destination: {
    country: string;
    city: string;
    postalCode?: string;
  };
  items: Array<{
    weight: number;
    dimensions?: { length: number; width: number; height: number };
    quantity: number;
  }>;
}

// ------------------------------------------------------------------
// Shipping Query Hooks
// ------------------------------------------------------------------

/**
 * Hook: useShippingRates
 * Fetch available shipping rates. Only enabled when both origin and
 * destination addresses are provided.
 */
export function useShippingRates(
  data: ShippingRateData | null,
): UseQueryResult<ShippingRate[], Error> {
  return useQuery({
    queryKey: shippingKeys.rate(data ?? ({} as ShippingRateRequest)),
    queryFn: () => {
      if (!data) throw new Error('Shipping rate data is required');
      const requestData: ShippingRateRequest = {
        origin: data.origin,
        destination: data.destination,
        items: data.items,
      };
      return shippingService.getShippingRates(requestData);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,
    enabled: !!data && !!data.origin && !!data.destination && data.items.length > 0,
    retry: 1,
  });
}

/**
 * Hook: useTrackShipment
 * Track a shipment by its tracking number and carrier.
 */
export function useTrackShipment(
  trackingNumber: string,
  carrier?: string,
): UseQueryResult<TrackingInfo, Error> {
  return useQuery({
    queryKey: shippingKeys.tracking(trackingNumber, carrier),
    queryFn: () => shippingService.trackShipment(trackingNumber, carrier),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
    enabled: !!trackingNumber && trackingNumber.trim().length > 0,
    refetchInterval: 60000, // Refetch every minute for live tracking
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook: useCarriers
 * Fetch available shipping carriers.
 */
export function useCarriers(): UseQueryResult<Carrier[], Error> {
  return useQuery({
    queryKey: shippingKeys.carriers(),
    queryFn: () => shippingService.getCarriers(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30,
  });
}

// ------------------------------------------------------------------
// Shipping Mutation Hooks
// ------------------------------------------------------------------

/**
 * Hook: useCreateShipment
 * Mutation to create a new shipment for an order.
 */
export function useCreateShipment(): UseMutationResult<
  Shipment,
  Error,
  CreateShipmentData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateShipmentData) =>
      shippingService.createShipment(data),
    onSuccess: (shipment) => {
      // Invalidate related order and shipments
      if (shipment.orderId) {
        queryClient.invalidateQueries({
          queryKey: ['orders', 'detail', shipment.orderId],
        });
      }
      queryClient.invalidateQueries({ queryKey: shippingKeys.shipments() });
    },
  });
}
