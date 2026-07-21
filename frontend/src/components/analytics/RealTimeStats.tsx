'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Users,
  Eye,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  UserPlus,
  MousePointerClick,
} from 'lucide-react';

interface RealTimeStat {
  metric: string;
  value: number;
  change: number;
  changeType: 'up' | 'down' | 'neutral';
  timestamp: string;
}

interface ActivityEvent {
  id: string;
  type: 'order' | 'signup' | 'pageview' | 'cart' | 'commission';
  description: string;
  value?: string;
  timestamp: Date;
}

const metricLabels: Record<string, { label: string; icon: React.ElementType; unit: string }> = {
  active_users: { label: 'Active Users', icon: Users, unit: '' },
  page_views: { label: 'Page Views', icon: Eye, unit: '' },
  conversion_rate: { label: 'Conversion Rate', icon: MousePointerClick, unit: '%' },
  avg_session_duration: { label: 'Avg Session', icon: Clock, unit: 's' },
  bounce_rate: { label: 'Bounce Rate', icon: TrendingDown, unit: '%' },
  revenue_per_minute: { label: 'Revenue/min', icon: TrendingUp, unit: '$' },
  cart_abandonment: { label: 'Cart Abandonment', icon: ShoppingCart, unit: '%' },
  new_signups: { label: 'New Signups', icon: UserPlus, unit: '' },
};

export function RealTimeStats() {
  const [stats, setStats] = useState<RealTimeStat[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const eventIdCounter = useRef(0);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Simulate incoming activity events
    const eventInterval = setInterval(() => {
      const eventTypes: ActivityEvent['type'][] = ['order', 'signup', 'pageview', 'cart', 'commission'];
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const newEvent = generateRandomEvent(type);
      setEvents((prev) => [newEvent, ...prev].slice(0, 50));
    }, 3000);
    return () => clearInterval(eventInterval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics/realtime');
      if (res.ok) {
        const data = await res.json();
        setStats(data.data || []);
        setLastUpdated(new Date());

        // Generate events from stats changes
        if (data.data) {
          const newEvents: ActivityEvent[] = [];
          for (const stat of data.data) {
            if (stat.change !== 0) {
              newEvents.push({
                id: `evt-${++eventIdCounter.current}`,
                type: stat.metric === 'new_signups' ? 'signup' : stat.metric.includes('order') ? 'order' : 'pageview',
                description: `${metricLabels[stat.metric]?.label || stat.metric} ${stat.change > 0 ? 'increased' : 'decreased'} by ${Math.abs(stat.change).toFixed(1)}%`,
                timestamp: new Date(),
              });
            }
          }
          if (newEvents.length > 0) {
            setEvents((prev) => [...newEvents, ...prev].slice(0, 50));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomEvent = (type: ActivityEvent['type']): ActivityEvent => {
    const descriptions: Record<string, string[]> = {
      order: [
        'New order #ORD-{:d} placed',
        'Order #{:d} completed successfully',
        'Bulk order #{:d} received',
        'Repeat customer placed order #{:d}',
      ],
      signup: [
        'New user registration',
        'Affiliate partner signed up',
        'Business account created',
        'New vendor registration',
      ],
      pageview: [
        'Product page spike detected',
        'Category page trending',
        'Search volume increasing',
      ],
      cart: [
        'Item added to cart',
        'Cart checkout initiated',
        'Wishlist item purchased',
      ],
      commission: [
        'Commission payout processed',
        'MLM bonus distributed',
        'Affiliate commission earned',
      ],
    };

    const descList = descriptions[type] || descriptions.pageview;
    const desc = descList[Math.floor(Math.random() * descList.length)].replace(
      '{:d}',
      String(Math.floor(Math.random() * 90000) + 10000)
    );

    return {
      id: `evt-${++eventIdCounter.current}`,
      type,
      description: desc,
      value: type === 'order' ? `$${(Math.random() * 500 + 20).toFixed(2)}` : undefined,
      timestamp: new Date(),
    };
  };

  const getEventConfig = (type: string) => {
    const configs: Record<string, { color: string; bg: string }> = {
      order: { color: 'text-blue-600', bg: 'bg-blue-50' },
      signup: { color: 'text-green-600', bg: 'bg-green-50' },
      pageview: { color: 'text-gray-600', bg: 'bg-gray-50' },
      cart: { color: 'text-orange-600', bg: 'bg-orange-50' },
      commission: { color: 'text-purple-600', bg: 'bg-purple-50' },
    };
    return configs[type] || configs.pageview;
  };

  const formatValue = (stat: RealTimeStat) => {
    const config = metricLabels[stat.metric];
    if (!config) return String(stat.value);

    if (stat.metric === 'revenue_per_minute') {
      return `$${stat.value.toFixed(2)}`;
    }
    if (stat.metric === 'conversion_rate' || stat.metric === 'bounce_rate' || stat.metric === 'cart_abandonment') {
      return `${stat.value.toFixed(1)}%`;
    }
    if (stat.metric === 'avg_session_duration') {
      const mins = Math.floor(stat.value / 60);
      const secs = Math.floor(stat.value % 60);
      return `${mins}m ${secs}s`;
    }
    return stat.value.toLocaleString();
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity className="w-5 h-5 text-green-600" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <h3 className="font-semibold text-gray-900">Real-time Dashboard</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Zap className="w-3 h-3" />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))
          : stats.map((stat) => {
              const config = metricLabels[stat.metric] || {
                label: stat.metric,
                icon: Activity,
                unit: '',
              };
              const Icon = config.icon;
              const isPositive =
                (stat.changeType === 'up' && stat.metric !== 'bounce_rate' && stat.metric !== 'cart_abandonment') ||
                (stat.changeType === 'down' && (stat.metric === 'bounce_rate' || stat.metric === 'cart_abandonment'));

              return (
                <div
                  key={stat.metric}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span
                      className={`flex items-center gap-0.5 text-xs font-medium ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.change > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(stat.change).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatValue(stat)}</p>
                  <p className="text-xs text-gray-500 mt-1">{config.label}</p>
                </div>
              );
            })}
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Live Activity Feed
            </h4>
            <span className="flex items-center gap-1.5 text-xs text-green-600">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[500px] overflow-auto">
            {events.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                Waiting for activity...
              </div>
            )}
            {events.map((event) => {
              const config = getEventConfig(event.type);
              return (
                <div
                  key={event.id}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-xs font-medium ${config.color} uppercase`}>
                        {event.type[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{event.description}</p>
                      <p className="text-[10px] text-gray-400">{timeAgo(event.timestamp)}</p>
                    </div>
                  </div>
                  {event.value && (
                    <span className="text-sm font-medium text-gray-900">{event.value}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Performance
          </h4>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Revenue Today</span>
                <span className="text-sm font-semibold text-gray-900">$12,450</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full">
                <div className="w-[72%] h-full bg-emerald-500 rounded-full" />
              </div>
              <p className="text-xs text-gray-400 mt-1">72% of daily target</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Orders Today</span>
                <span className="text-sm font-semibold text-gray-900">142</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full">
                <div className="w-[85%] h-full bg-blue-500 rounded-full" />
              </div>
              <p className="text-xs text-gray-400 mt-1">85% of daily target</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">New Customers</span>
                <span className="text-sm font-semibold text-gray-900">28</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full">
                <div className="w-[56%] h-full bg-purple-500 rounded-full" />
              </div>
              <p className="text-xs text-gray-400 mt-1">56% of daily target</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Commission Payouts</span>
                <span className="text-sm font-semibold text-gray-900">$3,240</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full">
                <div className="w-[64%] h-full bg-orange-500 rounded-full" />
              </div>
              <p className="text-xs text-gray-400 mt-1">64% of daily target</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Traffic Sources</h5>
            <div className="space-y-2">
              {[
                { source: 'Organic Search', value: 45, color: 'bg-blue-500' },
                { source: 'Direct', value: 28, color: 'bg-emerald-500' },
                { source: 'Social Media', value: 15, color: 'bg-purple-500' },
                { source: 'Referral', value: 8, color: 'bg-orange-500' },
                { source: 'Email', value: 4, color: 'bg-pink-500' },
              ].map((item) => (
                <div key={item.source} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-24 truncate">{item.source}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
