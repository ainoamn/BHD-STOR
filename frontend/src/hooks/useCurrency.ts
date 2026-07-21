import { useMemo, useCallback } from 'react';
import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';
import { currencyService } from '@/services/currency.service';
import type {
  Currency,
  ConversionResult,
} from '@/services/currency.service';
import { useLocalStorage } from './useLocalStorage';

// ------------------------------------------------------------------
// Query Keys
// ------------------------------------------------------------------
export const currencyKeys = {
  all: ['currency'] as const,
  currencies: () => [...currencyKeys.all, 'currencies'] as const,
  active: () => [...currencyKeys.all, 'active'] as const,
  default: () => [...currencyKeys.all, 'default'] as const,
  convert: (amount: number, from: string, to: string) =>
    [...currencyKeys.all, 'convert', amount, from, to] as const,
};

// ------------------------------------------------------------------
// LocalStorage Key
// ------------------------------------------------------------------
const CURRENCY_STORAGE_KEY = 'bhd_current_currency';

// ------------------------------------------------------------------
// Currency Query Hooks
// ------------------------------------------------------------------

/**
 * Hook: useCurrencies
 * Fetch all available currencies.
 */
export function useCurrencies(): UseQueryResult<Currency[], Error> {
  return useQuery({
    queryKey: currencyKeys.currencies(),
    queryFn: () => currencyService.getCurrencies(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Hook: useActiveCurrencies
 * Fetch only active/enabled currencies.
 */
export function useActiveCurrencies(): UseQueryResult<Currency[], Error> {
  return useQuery({
    queryKey: currencyKeys.active(),
    queryFn: () => currencyService.getActiveCurrencies(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });
}

/**
 * Hook: useDefaultCurrency
 * Fetch the system's default currency.
 */
export function useDefaultCurrency(): UseQueryResult<Currency, Error> {
  return useQuery({
    queryKey: currencyKeys.default(),
    queryFn: () => currencyService.getDefaultCurrency(),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Hook: useConvert
 * Convert an amount from one currency to another.
 */
export function useConvert(
  amount: number,
  from: string,
  to: string,
): UseQueryResult<ConversionResult, Error> {
  return useQuery({
    queryKey: currencyKeys.convert(amount, from, to),
    queryFn: () => currencyService.convert(amount, from, to),
    staleTime: 1000 * 60 * 5, // 5 minutes (rates change periodically)
    gcTime: 1000 * 60 * 15,
    enabled: !!from && !!to && from !== to && amount > 0,
  });
}

// ------------------------------------------------------------------
// State & Helper Hooks
// ------------------------------------------------------------------

/**
 * Hook: useCurrentCurrency
 * Manage the currently selected currency with localStorage persistence.
 * Falls back to the system's default currency.
 */
export function useCurrentCurrency(): {
  currency: Currency | null;
  setCurrency: (currency: Currency) => void;
  isLoading: boolean;
} {
  const { data: defaultCurrency, isLoading: defaultLoading } =
    useDefaultCurrency();
  const { data: activeCurrencies } = useActiveCurrencies();

  const [storedCurrencyCode, setStoredCurrencyCode] = useLocalStorage<string>(
    CURRENCY_STORAGE_KEY,
    '',
  );

  const currency = useMemo(() => {
    if (storedCurrencyCode && activeCurrencies) {
      const found = activeCurrencies.find(
        (c) => c.code === storedCurrencyCode,
      );
      if (found) return found;
    }
    return defaultCurrency ?? null;
  }, [storedCurrencyCode, activeCurrencies, defaultCurrency]);

  const setCurrency = useCallback(
    (newCurrency: Currency) => {
      setStoredCurrencyCode(newCurrency.code);
    },
    [setStoredCurrencyCode],
  );

  return {
    currency,
    setCurrency,
    isLoading: defaultLoading,
  };
}

/**
 * Hook: useFormatPrice
 * Format a price amount according to the current currency settings.
 */
export function useFormatPrice(): {
  formatPrice: (amount: number, currencyCode?: string) => string;
  formatPriceWithSymbol: (amount: number, currencyCode?: string) => string;
} {
  const { currency: currentCurrency } = useCurrentCurrency();
  const { data: currencies } = useCurrencies();

  const formatPrice = useCallback(
    (amount: number, currencyCode?: string): string => {
      const targetCode = currencyCode ?? currentCurrency?.code ?? 'OMR';
      const currency = currencies?.find((c) => c.code === targetCode);

      const decimals = currency?.decimalPlaces ?? 3;
      const locale = currency?.locale ?? 'en-OM';

      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount);
    },
    [currentCurrency, currencies],
  );

  const formatPriceWithSymbol = useCallback(
    (amount: number, currencyCode?: string): string => {
      const targetCode = currencyCode ?? currentCurrency?.code ?? 'OMR';
      const currency = currencies?.find((c) => c.code === targetCode);

      const decimals = currency?.decimalPlaces ?? 3;
      const locale = currency?.locale ?? 'en-OM';
      const symbol = currency?.symbol ?? targetCode;
      const position = currency?.symbolPosition ?? 'before';

      const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount);

      return position === 'after'
        ? `${formatted} ${symbol}`
        : `${symbol} ${formatted}`;
    },
    [currentCurrency, currencies],
  );

  return { formatPrice, formatPriceWithSymbol };
}

export const useCurrency = () => {
  const current = useCurrentCurrency();
  const { formatPrice, formatPriceWithSymbol } = useFormatPrice();
  return { ...current, formatPrice, formatPriceWithSymbol };
};
