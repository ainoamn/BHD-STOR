import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTodayEarnings, useWeeklyEarnings, useMonthlyEarnings, useEarningsChart } from '../../hooks/useDriverEarnings';
import type { EarningPeriod, EarningType } from '../../types/driver.types';

type PeriodTab = EarningPeriod;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const earningTypeConfig: Record<EarningType, { color: string; bg: string; icon: string; label: string }> = {
  delivery_fee: { color: '#3B82F6', bg: '#DBEAFE', icon: 'truck-delivery', label: 'Delivery' },
  bonus: { color: '#F59E0B', bg: '#FEF3C7', icon: 'star', label: 'Bonus' },
  tip: { color: '#10B981', bg: '#D1FAE5', icon: 'hand-coin', label: 'Tip' },
  adjustment: { color: '#8B5CF6', bg: '#EDE9FE', icon: 'swap-horizontal', label: 'Adj.' },
};

export const EarningsScreen: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<PeriodTab>('today');
  const { earnings, summary, stats, isLoading } = useTodayEarnings();
  const { earnings: weekEarnings, summary: weekSummary } = useWeeklyEarnings();
  const { earnings: monthEarnings, summary: monthSummary } = useMonthlyEarnings();
  const chartData = useEarningsChart(activePeriod);

  const currentData = useMemo(() => {
    switch (activePeriod) {
      case 'today':
        return { earnings, summary, stats };
      case 'week':
        return { earnings: weekEarnings, summary: weekSummary, stats: null };
      case 'month':
        return { earnings: monthEarnings, summary: monthSummary, stats: null };
      default:
        return { earnings, summary, stats };
    }
  }, [activePeriod, earnings, summary, stats, weekEarnings, weekSummary, monthEarnings, monthSummary]);

  const maxChartValue = Math.max(...chartData.map(d => d.total), 1);

  const periods: { key: PeriodTab; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Earnings</Text>
        <View style={styles.withdrawBadge}>
          <Icon name="wallet-outline" size={16} color="#3B82F6" />
          <Text style={styles.withdrawText}>BHD {currentData.summary.paid.toFixed(2)}</Text>
        </View>
      </View>

      {/* Period Tabs */}
      <View style={styles.periodTabs}>
        {periods.map(period => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodTab,
              activePeriod === period.key && styles.periodTabActive,
            ]}
            onPress={() => setActivePeriod(period.key)}
          >
            <Text
              style={[
                styles.periodTabText,
                activePeriod === period.key && styles.periodTabTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Total Earnings Card */}
      <View style={styles.totalCard}>
        <View style={styles.totalHeader}>
          <Text style={styles.totalLabel}>Total Earnings</Text>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>
              BHD {currentData.summary.pending.toFixed(2)} pending
            </Text>
          </View>
        </View>
        <Text style={styles.totalAmount}>
          BHD {currentData.summary.total.toFixed(2)}
        </Text>
        {currentData.stats && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentData.stats.deliveryCount}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                BHD {currentData.stats.averagePerDelivery.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>Avg/Delivery</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                BHD {(currentData.summary.byType['tip'] || 0).toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>Tips</Text>
            </View>
          </View>
        )}
      </View>

      {/* Earnings Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Breakdown</Text>
        <View style={styles.breakdownCard}>
          {Object.entries(currentData.summary.byType).map(([type, amount]) => {
            const config = earningTypeConfig[type as EarningType] || earningTypeConfig.delivery_fee;
            const percentage = currentData.summary.total > 0
              ? (amount / currentData.summary.total) * 100
              : 0;
            return (
              <View key={type} style={styles.breakdownItem}>
                <View style={styles.breakdownLeft}>
                  <View style={[styles.breakdownIcon, { backgroundColor: config.bg }]}>
                    <Icon name={config.icon} size={18} color={config.color} />
                  </View>
                  <View>
                    <Text style={styles.breakdownLabel}>{config.label}</Text>
                    <View style={styles.breakdownBar}>
                      <View
                        style={[
                          styles.breakdownBarFill,
                          { width: `${percentage}%`, backgroundColor: config.color },
                        ]}
                      />
                    </View>
                  </View>
                </View>
                <Text style={[styles.breakdownAmount, { color: config.color }]}>
                  BHD {amount.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Chart */}
      {chartData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings Chart</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {chartData.map((item, index) => (
                <View key={index} style={styles.chartBarContainer}>
                  <View style={styles.chartBarWrapper}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: `${(item.total / maxChartValue) * 100}%`,
                          backgroundColor: index === chartData.length - 1 ? '#3B82F6' : '#93C5FD',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartLabel}>{item.label}</Text>
                  <Text style={styles.chartValue}>BHD {item.total.toFixed(1)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Earnings List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {currentData.earnings.slice(0, 10).map(earning => {
          const config = earningTypeConfig[earning.type] || earningTypeConfig.delivery_fee;
          return (
            <View key={earning.id} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: config.bg }]}>
                  <Icon name={config.icon} size={18} color={config.color} />
                </View>
                <View>
                  <Text style={styles.transactionLabel}>{config.label}</Text>
                  {earning.trackingNumber !== '-' && (
                    <Text style={styles.transactionTracking}>{earning.trackingNumber}</Text>
                  )}
                  <Text style={styles.transactionDate}>{earning.date}</Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={[styles.transactionAmount, { color: config.color }]}>
                  +BHD {earning.amount.toFixed(2)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: earning.status === 'paid' ? '#D1FAE5' : '#FEF3C7' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: earning.status === 'paid' ? '#10B981' : '#F59E0B' },
                    ]}
                  >
                    {earning.status === 'paid' ? 'Paid' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Withdraw Button */}
      <View style={styles.withdrawSection}>
        <TouchableOpacity style={styles.withdrawButton}>
          <Icon name="bank-transfer-out" size={20} color="#fff" />
          <Text style={styles.withdrawButtonText}>Withdraw Earnings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  withdrawBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  withdrawText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  periodTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: '#3B82F6',
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodTabTextActive: {
    color: '#fff',
  },
  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  breakdownBar: {
    width: 120,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
  },
  breakdownBarFill: {
    height: 4,
    borderRadius: 2,
  },
  breakdownAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 20,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarWrapper: {
    width: 40,
    height: 100,
    justifyContent: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  chartBar: {
    borderRadius: 6,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
  },
  chartValue: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  transactionTracking: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  transactionDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  withdrawSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 30,
  },
});
