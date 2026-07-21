import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { driverService } from '../services/driver.service';
import type { EarningPeriod, Earning } from '../types/driver.types';

const EARNINGS_QUERY_KEY = 'earnings';

export function useEarnings(period: EarningPeriod) {
  const query = useQuery({
    queryKey: [EARNINGS_QUERY_KEY, period],
    queryFn: () => driverService.getEarnings(period),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const summary = useMemo(() => {
    const earnings = query.data ?? [];
    const total = earnings.reduce((sum, e) => sum + e.amount, 0);
    const byType = earnings.reduce<Record<string, number>>(
      (acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + e.amount;
        return acc;
      },
      {},
    );
    const paid = earnings
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0);
    const pending = earnings
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0);

    return { total, byType, paid, pending };
  }, [query.data]);

  return {
    earnings: query.data ?? [],
    summary,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useTodayEarnings() {
  const { earnings, summary, isLoading, refetch } = useEarnings('today');

  const stats = useMemo(() => {
    const earningsList = earnings;
    const deliveryCount = earningsList.filter(e => e.type === 'delivery_fee').length;
    const averagePerDelivery = deliveryCount > 0 ? summary.total / deliveryCount : 0;

    return {
      deliveryCount,
      averagePerDelivery,
      bonusAmount: summary.byType['bonus'] || 0,
      tipAmount: summary.byType['tip'] || 0,
    };
  }, [earnings, summary]);

  return {
    earnings,
    summary,
    stats,
    isLoading,
    refetch,
  };
}

export function useWeeklyEarnings() {
  return useEarnings('week');
}

export function useMonthlyEarnings() {
  return useEarnings('month');
}

export function useEarningsChart(period: EarningPeriod) {
  const { earnings } = useEarnings(period);

  const chartData = useMemo(() => {
    const grouped = earnings.reduce<Record<string, Earning[]>>((acc, e) => {
      const date = e.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(e);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([date, items]) => ({
        date,
        label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        total: items.reduce((sum, e) => sum + e.amount, 0),
        count: items.filter(e => e.type === 'delivery_fee').length,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [earnings]);

  return chartData;
}
