'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { returnsService, ReturnRequest, ReturnStatus, CreateReturnData, ReturnsQuery } from '@/services/returns.service';

const RETURNS_KEY = 'returns';

export function useReturns(query?: ReturnsQuery, options?: UseQueryOptions<{ items: ReturnRequest[]; total: number }>) {
  return useQuery({
    queryKey: [RETURNS_KEY, query],
    queryFn: () => returnsService.getAll(query),
    ...options,
  });
}

export function useReturnsAdmin(query?: ReturnsQuery, options?: UseQueryOptions<{ items: ReturnRequest[]; total: number }>) {
  return useQuery({
    queryKey: [RETURNS_KEY, 'admin', query],
    queryFn: () => returnsService.getAllAdmin(query),
    ...options,
  });
}

export function useReturn(id: string, options?: UseQueryOptions<ReturnRequest>) {
  return useQuery({
    queryKey: [RETURNS_KEY, id],
    queryFn: () => returnsService.getById(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReturnData) => returnsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY] });
    },
  });
}

export function useUpdateReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateReturnData> }) =>
      returnsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY] });
    },
  });
}

export function useUpdateReturnStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: ReturnStatus; notes?: string }) =>
      returnsService.updateStatus(id, status, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY] });
    },
  });
}

export function useApproveReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, refundAmount }: { id: string; refundAmount?: number }) =>
      returnsService.approve(id, refundAmount),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY] });
    },
  });
}

export function useRejectReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      returnsService.reject(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY] });
    },
  });
}

export function useProcessRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => returnsService.processRefund(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY] });
    },
  });
}

export function useProcessExchange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => returnsService.processExchange(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY] });
    },
  });
}

export function useMarkReceived() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => returnsService.markReceived(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY] });
    },
  });
}

export function useDeleteReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => returnsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RETURNS_KEY] });
    },
  });
}

export function useReturnPolicy(storeId: string, options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: [RETURNS_KEY, 'policy', storeId],
    queryFn: () => returnsService.getPolicy(storeId),
    enabled: !!storeId,
    ...options,
  });
}
