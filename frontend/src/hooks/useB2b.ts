'use client';

import { useState, useEffect, useCallback } from 'react';
import * as b2bService from '../services/b2b.service';

// ────────────────────────────────────────────────────────────────
// useB2bShipments - Fetch and filter shipments
// ────────────────────────────────────────────────────────────────

export function useB2bShipments(filters: b2bService.ShipmentFilters = {}) {
  const [shipments, setShipments] = useState<b2bService.Shipment[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await b2bService.getShipments(filters);
      setShipments(result.data);
      setMeta(result.meta);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load shipments';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    filters.status,
    filters.dateFrom,
    filters.dateTo,
    filters.referenceNumber,
    filters.page,
    filters.limit,
  ]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  return { shipments, meta, loading, error, refresh: fetchShipments };
}

// ────────────────────────────────────────────────────────────────
// useCreateB2bShipment - Create shipment with loading state
// ────────────────────────────────────────────────────────────────

export function useCreateB2bShipment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipment, setShipment] = useState<b2bService.Shipment | null>(null);

  const createShipment = useCallback(
    async (data: b2bService.CreateShipmentData) => {
      setLoading(true);
      setError(null);
      try {
        const result = await b2bService.createShipment(data);
        setShipment(result.data);
        return result.data;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to create shipment';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { createShipment, loading, error, shipment };
}

// ────────────────────────────────────────────────────────────────
// useTrackShipment - Track a shipment by tracking number
// ────────────────────────────────────────────────────────────────

export interface TrackingResult {
  trackingNumber: string;
  referenceNumber: string | null;
  status: string;
  statusLabel: string;
  receiver: { name: string; address: string };
  timeline: Array<{
    status: string;
    label: string;
    time: string;
    location: string;
  }>;
  estimatedDelivery: string | null;
}

export function useTrackShipment() {
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const track = useCallback(async (trackingNumber: string) => {
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return null;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await b2bService.trackShipment(trackingNumber.trim());
      setResult(response.data);
      return response.data;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to track shipment';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { track, result, loading, error };
}

// ────────────────────────────────────────────────────────────────
// useB2bBilling - Fetch billing statements
// ────────────────────────────────────────────────────────────────

export function useB2bBilling(period?: string) {
  const [statements, setStatements] = useState<b2bService.BillingStatement[]>(
    [],
  );
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await b2bService.getBilling(period);
      setStatements(result.data);
      setMeta(result.meta);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load billing data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  return { statements, meta, loading, error, refresh: fetchBilling };
}

// ────────────────────────────────────────────────────────────────
// useB2bSettings - Fetch and update settings
// ────────────────────────────────────────────────────────────────

export function useB2bSettings() {
  const [settings, setSettings] = useState<b2bService.B2bSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await b2bService.getSettings();
      setSettings(result.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load settings';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(
    async (data: Partial<b2bService.B2bSettings>) => {
      setSaving(true);
      setSaveError(null);
      try {
        await b2bService.updateSettings(data);
        setSettings((prev) => (prev ? { ...prev, ...data } : null));
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to update settings';
        setSaveError(message);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return {
    settings,
    loading,
    saving,
    error,
    saveError,
    refresh: fetchSettings,
    updateSettings,
  };
}

// ────────────────────────────────────────────────────────────────
// useB2bAccount - Fetch account summary
// ────────────────────────────────────────────────────────────────

export function useB2bAccount() {
  const [account, setAccount] = useState<b2bService.AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await b2bService.getAccount();
      setAccount(result.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load account info';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  return { account, loading, error, refresh: fetchAccount };
}

// ────────────────────────────────────────────────────────────────
// useB2bAuth - Authentication state management
// ────────────────────────────────────────────────────────────────

export function useB2bAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
    const key = b2bService.getApiKey();
    setIsAuthenticated(!!key);
    if (key) {
      // Try to get company name from account
      b2bService
        .getAccount()
        .then((res) => {
          setCompanyName(res.data.companyName);
          setIsAuthenticated(true);
        })
        .catch(() => {
          b2bService.clearApiKey();
          setIsAuthenticated(false);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (apiKey: string) => {
    try {
      const result = await b2bService.login(apiKey);
      setIsAuthenticated(true);
      setCompanyName(result.customer.companyName);
      return result;
    } catch {
      setIsAuthenticated(false);
      throw new Error('Invalid API key');
    }
  }, []);

  const logout = useCallback(() => {
    b2bService.clearApiKey();
    setIsAuthenticated(false);
    setCompanyName('');
  }, []);

  return { isAuthenticated, loading, companyName, login, logout };
}

// ────────────────────────────────────────────────────────────────
// usePriceCalculator - Client-side price calculation
// ────────────────────────────────────────────────────────────────

export function usePriceCalculator() {
  const [result, setResult] = useState<b2bService.PricingResult | null>(null);

  const calculate = useCallback((input: b2bService.PricingInput) => {
    const price = b2bService.calculatePrice(input);
    setResult(price);
    return price;
  }, []);

  return { result, calculate };
}
