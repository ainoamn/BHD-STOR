'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRewards, usePointsBalance } from '@/hooks/useLoyalty';
import { RewardCard } from '@/components/loyalty/RewardCard';
import { RewardType } from '@/services/loyalty.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Gift,
  ArrowLeft,
  Search,
  Percent,
  Truck,
  Package,
  Coins,
  Sparkles,
} from 'lucide-react';

const typeFilters = [
  { value: 'all', label: 'All', icon: <Sparkles className="w-3 h-3" /> },
  { value: 'discount', label: 'Discounts', icon: <Percent className="w-3 h-3" /> },
  { value: 'free_shipping', label: 'Free Shipping', icon: <Truck className="w-3 h-3" /> },
  { value: 'free_product', label: 'Free Products', icon: <Package className="w-3 h-3" /> },
  { value: 'cashback', label: 'Cashback', icon: <Coins className="w-3 h-3" /> },
];

export default function RewardsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [sortBy, setSortBy] = useState<'points' | 'name'>('points');

  const { data: rewards, isLoading, error } = useRewards();
  const { data: balance } = usePointsBalance();

  const userPoints = balance?.available || 0;

  // Filter rewards
  const filteredRewards = rewards?.filter((reward) => {
    // Type filter
    if (activeType !== 'all' && reward.type !== activeType) return false;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        reward.name.toLowerCase().includes(searchLower) ||
        (reward.description?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    return true;
  }) || [];

  // Sort rewards
  const sortedRewards = [...filteredRewards].sort((a, b) => {
    if (sortBy === 'points') return a.pointsCost - b.pointsCost;
    return a.name.localeCompare(b.name);
  });

  // Separate into affordable and not
  const affordableRewards = sortedRewards.filter((r) => userPoints >= r.pointsCost);
  const unaffordableRewards = sortedRewards.filter((r) => userPoints < r.pointsCost);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push('/loyalty')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Rewards Catalog</h1>
            <p className="text-sm text-muted-foreground">
              Redeem your points for exclusive rewards
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Coins className="w-4 h-4 mr-1 text-yellow-500" />
            {userPoints.toLocaleString()} pts
          </Badge>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search rewards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {typeFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={activeType === filter.value ? 'default' : 'outline'}
              size="sm"
              className="gap-1"
              onClick={() => setActiveType(filter.value)}
            >
              {filter.icon}
              {filter.label}
            </Button>
          ))}
          <div className="ml-auto flex gap-2">
            <Button
              variant={sortBy === 'points' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('points')}
            >
              Points
            </Button>
            <Button
              variant={sortBy === 'name' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('name')}
            >
              Name
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load rewards. Please try again.</p>
        </div>
      ) : sortedRewards.length === 0 ? (
        <div className="text-center py-16">
          <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-1">No rewards found</h3>
          <p className="text-sm text-muted-foreground">
            {search || activeType !== 'all'
              ? 'Try adjusting your filters'
              : 'Check back later for new rewards!'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Affordable Rewards */}
          {affordableRewards.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-500" />
                You Can Redeem ({affordableRewards.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {affordableRewards.map((reward) => (
                  <RewardCard key={reward.id} reward={reward} userPoints={userPoints} />
                ))}
              </div>
            </div>
          )}

          {/* Unaffordable Rewards */}
          {unaffordableRewards.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                <Gift className="w-5 h-5" />
                More Rewards ({unaffordableRewards.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unaffordableRewards.map((reward) => (
                  <RewardCard key={reward.id} reward={reward} userPoints={userPoints} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
