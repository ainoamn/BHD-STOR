// =============================================================================
// BHD Oman Marketplace - Currency Service
// =============================================================================

import { api } from './api';
import { Currency } from '../types';

export type { Currency };

export interface ConversionResult {
  amount: number;
  from: string;
  to: string;
  result: number;
}

// ---------------------------------------------------------------------------
// Currency Endpoints
// ---------------------------------------------------------------------------

/**
 * Get all currencies configured in the system.
 * @returns List of all currencies (active and inactive)
 */
export async function getCurrencies(): Promise<Currency[]> {
  const response = await api.get<{ success: boolean; data: Currency[] }>(
    '/currencies'
  );
  return response.data.data;
}

/**
 * Get all active currencies available for display/pricing.
 * @returns List of active currencies
 */
export async function getActiveCurrencies(): Promise<Currency[]> {
  const response = await api.get<{ success: boolean; data: Currency[] }>(
    '/currencies/active'
  );
  return response.data.data;
}

/**
 * Convert an amount from one currency to another.
 * @param amount - Amount to convert
 * @param from - Source currency code (e.g., 'OMR')
 * @param to - Target currency code (e.g., 'USD')
 * @returns Converted amount
 */
export async function convert(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  const response = await api.get<{ success: boolean; data: { result: number } }>(
    '/currencies/convert',
    {
      params: { amount, from, to },
    }
  );
  return response.data.data.result;
}

/**
 * Get the system's default currency.
 * @returns Default currency details
 */
export async function getDefaultCurrency(): Promise<Currency> {
  const response = await api.get<{ success: boolean; data: Currency }>(
    '/currencies/default'
  );
  return response.data.data;
}

/**
 * Get the current user's preferred currency.
 * @returns User's preferred currency code
 */
export async function getUserCurrency(): Promise<Currency> {
  const response = await api.get<{ success: boolean; data: Currency }>(
    '/currencies/user'
  );
  return response.data.data;
}

/**
 * Set the current user's preferred currency.
 * @param currencyCode - Currency code (e.g., 'OMR', 'USD')
 * @returns Updated user currency preference
 */
export async function setUserCurrency(currencyCode: string): Promise<Currency> {
  const response = await api.patch<{ success: boolean; data: Currency }>(
    '/currencies/user',
    { currencyCode }
  );
  return response.data.data;
}

/**
 * Batch convert multiple amounts at once (more efficient than individual calls).
 * @param conversions - Array of { amount, from, to }
 * @returns Array of converted amounts in the same order
 */
export async function batchConvert(
  conversions: Array<{ amount: number; from: string; to: string }>
): Promise<number[]> {
  const response = await api.post<{
    success: boolean;
    data: { results: number[] };
  }>('/currencies/convert/batch', { conversions });
  return response.data.data.results;
}

/**
 * Get the latest exchange rates relative to the base currency.
 * @param baseCurrency - Base currency code (default 'OMR')
 * @returns Map of currency codes to exchange rates
 */
export async function getExchangeRates(
  baseCurrency = 'OMR'
): Promise<Record<string, number>> {
  const response = await api.get<{
    success: boolean;
    data: { rates: Record<string, number>; base: string; date: string };
  }>('/currencies/rates', { params: { base: baseCurrency } });
  return response.data.data.rates;
}

export const currencyService = {
  getCurrencies,
  getActiveCurrencies,
  convert: async (amount: number, from: string, to: string): Promise<ConversionResult> => {
    const result = await convert(amount, from, to);
    return { amount, from, to, result };
  },
  getDefaultCurrency,
  getUserCurrency,
  setUserCurrency,
  batchConvert,
  getExchangeRates,
};
