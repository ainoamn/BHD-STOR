import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverService } from '../services/driver.service';
import { useDriverStore } from '../store/driverStore';
import type { Shipment, ShipmentStatus, DeliveryCompletionData } from '../types/driver.types';

const SHIPMENTS_QUERY_KEY = 'todayShipments';
const SHIPMENT_DETAIL_KEY = 'shipmentDetail';

export function useTodayShipments() {
  const setTodayShipments = useDriverStore(state => state.setTodayShipments);
  const setLoading = useDriverStore(state => state.setLoadingShipments);

  const query = useQuery({
    queryKey: [SHIPMENTS_QUERY_KEY],
    queryFn: async () => {
      setLoading(true);
      try {
        const data = await driverService.getTodayShipments();
        setTodayShipments(data);
        return data;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    shipments: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useShipmentDetail(id: string) {
  return useQuery({
    queryKey: [SHIPMENT_DETAIL_KEY, id],
    queryFn: () => driverService.getShipmentDetail(id),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useUpdateShipmentStatus() {
  const queryClient = useQueryClient();
  const updateShipmentInList = useDriverStore(state => state.updateShipmentInList);

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ShipmentStatus }) =>
      driverService.updateShipmentStatus(id, status),
    onSuccess: data => {
      updateShipmentInList(data);
      queryClient.invalidateQueries({ queryKey: [SHIPMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SHIPMENT_DETAIL_KEY, data.id] });
    },
  });

  return {
    updateStatus: mutation.mutate,
    updateStatusAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}

export function useCompleteDelivery() {
  const queryClient = useQueryClient();
  const updateShipmentInList = useDriverStore(state => state.updateShipmentInList);
  const setActiveShipment = useDriverStore(state => state.setActiveShipment);

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeliveryCompletionData }) =>
      driverService.completeDelivery(id, data),
    onSuccess: result => {
      updateShipmentInList(result.shipment);
      setActiveShipment(null);
      queryClient.invalidateQueries({ queryKey: [SHIPMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SHIPMENT_DETAIL_KEY, result.shipment.id] });
    },
  });

  return {
    completeDelivery: mutation.mutate,
    completeDeliveryAsync: mutation.mutateAsync,
    isCompleting: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
  };
}

export function useFilteredShipments(filter: ShipmentStatus | 'all') {
  const { shipments, isLoading, refetch } = useTodayShipments();

  const filtered = shipments.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['pending', 'assigned'].includes(s.status);
    if (filter === 'in_progress') return ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.status);
    if (filter === 'completed') return ['delivered', 'failed', 'cancelled'].includes(s.status);
    return s.status === filter;
  });

  return {
    shipments: filtered,
    isLoading,
    refetch,
    counts: {
      all: shipments.length,
      pending: shipments.filter(s => ['pending', 'assigned'].includes(s.status)).length,
      in_progress: shipments.filter(s => ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)).length,
      completed: shipments.filter(s => ['delivered', 'failed', 'cancelled'].includes(s.status)).length,
    },
  };
}
