'use client';

import { useRouter } from 'next/navigation';
import { useLoyaltyAccount, usePointsBalance, useTier } from '@/hooks/useLoyalty';
import { LoyaltyCard } from '@/components/loyalty/LoyaltyCard';
import { TierProgress } from '@/components/loyalty/TierProgress';
import { ReferralCode } from '@/components/loyalty/ReferralCode';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/Badge';
import {
  Trophy,
  Gift,
  Clock,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export default function LoyaltyPage() {
  const router = useRouter();
  const { data: account, isLoading: accountLoading } = useLoyaltyAccount();
  const { data: balance, isLoading: balanceLoading } = usePointsBalance();
  const { data: tierData, isLoading: tierLoading } = useTier();

  const isLoading = accountLoading || balanceLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100">
            <Trophy className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Rewards Program</h1>
            <p className="text-sm text-muted-foreground">
              Earn points, unlock tiers, redeem rewards
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/loyalty/rewards')}>
            <Gift className="w-4 h-4 mr-1" />
            Rewards
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/loyalty/history')}>
            <Clock className="w-4 h-4 mr-1" />
            History
          </Button>
        </div>
      </div>

      {/* Points Card */}
      <div className="mb-6">
        <LoyaltyCard account={account} balance={balance} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Browse Rewards', icon: <Gift className="w-5 h-5" />, path: '/loyalty/rewards', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
          { label: 'Points History', icon: <Clock className="w-5 h-5" />, path: '/loyalty/history', color: 'bg-green-50 text-green-600 hover:bg-green-100' },
          { label: 'How It Works', icon: <Sparkles className="w-5 h-5" />, path: '#', color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
          { label: 'Invite Friends', icon: <Trophy className="w-5 h-5" />, path: '#referral', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
        ].map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className={`h-auto py-4 flex-col gap-2 ${action.color} border-transparent`}
            onClick={() => action.path.startsWith('#') ? undefined : router.push(action.path)}
          >
            {action.icon}
            <span className="text-xs font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Progress */}
        <TierProgress
          currentTier={account?.currentTier || balance?.tier || 'bronze'}
          lifetimePoints={account?.lifetimePoints || balance?.lifetime || 0}
          tiers={tierData?.tierData ? [tierData.tierData] : undefined}
        />

        {/* Referral Section */}
        <div id="referral">
          <ReferralCode />
        </div>
      </div>

      {/* How It Works */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            How It Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Earn Points',
                description: 'Earn 1 point for every OMR spent. Higher tiers earn even more with multipliers.',
                icon: <Trophy className="w-6 h-6 text-blue-600" />,
              },
              {
                step: '2',
                title: 'Unlock Tiers',
                description: 'Reach lifetime point milestones to unlock Silver, Gold, and Platinum tiers.',
                icon: <Sparkles className="w-6 h-6 text-purple-600" />,
              },
              {
                step: '3',
                title: 'Redeem Rewards',
                description: 'Use your points to get discounts, free shipping, and exclusive rewards.',
                icon: <Gift className="w-6 h-6 text-green-600" />,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  {item.icon}
                </div>
                <Badge variant="outline" className="mb-2">Step {item.step}</Badge>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
