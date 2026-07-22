'use client';

import { LoyaltyAccount, PointsBalance } from '@/services/loyalty.service';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Award,
  Star,
  Crown,
  Gem,
  Coins,
  TrendingUp,
  Gift,
  Sparkles,
} from 'lucide-react';

interface LoyaltyCardProps {
  account?: LoyaltyAccount | null;
  balance?: PointsBalance | null;
}

const tierConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  bronze: {
    icon: <Award className="w-5 h-5" />,
    color: 'text-amber-700',
    bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
    borderColor: 'border-amber-200',
  },
  silver: {
    icon: <Star className="w-5 h-5" />,
    color: 'text-slate-600',
    bgColor: 'bg-gradient-to-br from-slate-50 to-gray-100',
    borderColor: 'border-slate-300',
  },
  gold: {
    icon: <Crown className="w-5 h-5" />,
    color: 'text-yellow-600',
    bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50',
    borderColor: 'border-yellow-300',
  },
  platinum: {
    icon: <Gem className="w-5 h-5" />,
    color: 'text-indigo-600',
    bgColor: 'bg-gradient-to-br from-indigo-50 to-purple-50',
    borderColor: 'border-indigo-300',
  },
};

export function LoyaltyCard({ account, balance }: LoyaltyCardProps) {
  const tier = account?.currentTier || balance?.tier || 'bronze';
  const config = tierConfig[tier.toLowerCase()] || tierConfig.bronze;

  const availablePoints = balance?.available ?? account?.availablePoints ?? 0;
  const lifetimePoints = balance?.lifetime ?? account?.lifetimePoints ?? 0;
  const redeemedPoints = balance?.redeemed ?? account?.redeemedPoints ?? 0;

  return (
    <Card className={`overflow-hidden border-2 ${config.borderColor}`}>
      <CardContent className={`p-6 ${config.bgColor}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-white/80 ${config.color}`}>
              {config.icon}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Tier</p>
              <p className={`text-lg font-bold capitalize ${config.color}`}>
                {tier}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`capitalize ${config.color} bg-white/80`}>
            <Sparkles className="w-3 h-3 mr-1" />
            {tier} Member
          </Badge>
        </div>

        {/* Points Display */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white/60 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Coins className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Available</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {availablePoints.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>

          <div className="text-center p-3 bg-white/60 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Lifetime</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {lifetimePoints.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>

          <div className="text-center p-3 bg-white/60 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Gift className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">Redeemed</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {redeemedPoints.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
        </div>

        {/* Points Value */}
        <div className="mt-4 p-3 bg-white/60 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Your points are worth approximately{' '}
            <span className="font-semibold text-green-700">
              OMR {((availablePoints || 0) * 0.01).toFixed(3)}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
