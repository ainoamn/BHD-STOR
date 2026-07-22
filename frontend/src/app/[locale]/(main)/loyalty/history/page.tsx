'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTransactions } from '@/hooks/useLoyalty';
import { PointsHistory } from '@/components/loyalty/PointsHistory';
import { PointsTransactionType } from '@/services/loyalty.service';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  AlertTriangle,
  Filter,
} from 'lucide-react';

const filterTypes: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'earn', label: 'Earned' },
  { value: 'redeem', label: 'Redeemed' },
  { value: 'bonus', label: 'Bonuses' },
  { value: 'referral', label: 'Referrals' },
  { value: 'expire', label: 'Expired' },
  { value: 'adjustment', label: 'Adjustments' },
];

export default function LoyaltyHistoryPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useTransactions(page, 20);

  // Filter transactions
  const filteredItems = data?.items?.filter((tx) => {
    if (activeFilter === 'all') return true;
    return tx.type === activeFilter;
  }) || [];

  // Summary stats
  const stats = {
    earned: data?.items?.filter((t) => t.type === PointsTransactionType.EARN).reduce((sum, t) => sum + t.points, 0) || 0,
    redeemed: data?.items?.filter((t) => t.type === PointsTransactionType.REDEEM).reduce((sum, t) => sum + Math.abs(t.points), 0) || 0,
    bonuses: data?.items?.filter((t) => t.type === PointsTransactionType.BONUS).reduce((sum, t) => sum + t.points, 0) || 0,
    referrals: data?.items?.filter((t) => t.type === PointsTransactionType.REFERRAL).reduce((sum, t) => sum + t.points, 0) || 0,
  };

  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push('/loyalty')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Points History</h1>
            <p className="text-sm text-muted-foreground">
              Track all your points activity
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Earned', value: stats.earned, icon: <ArrowDownLeft className="w-4 h-4 text-green-600" />, color: 'bg-green-50' },
          { label: 'Redeemed', value: stats.redeemed, icon: <ArrowUpRight className="w-4 h-4 text-red-600" />, color: 'bg-red-50' },
          { label: 'Bonuses', value: stats.bonuses, icon: <Gift className="w-4 h-4 text-purple-600" />, color: 'bg-purple-50' },
          { label: 'Referrals', value: stats.referrals, icon: <Gift className="w-4 h-4 text-amber-600" />, color: 'bg-amber-50' },
        ].map((stat) => (
          <Card key={stat.label} className={stat.color}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {stat.icon}
                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-xl font-bold">
                {stat.value.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filterTypes.map((filter) => (
          <Button
            key={filter.value}
            variant={activeFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* History */}
      {error ? (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="w-5 h-5" />
          <p>Failed to load transaction history.</p>
        </div>
      ) : (
        <>
          <PointsHistory transactions={filteredItems} isLoading={isLoading} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
