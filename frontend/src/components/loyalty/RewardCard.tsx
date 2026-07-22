'use client';

import { useState } from 'react';
import { Reward, RewardType } from '@/services/loyalty.service';
import { useRedeemReward } from '@/hooks/useLoyalty';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import {
  Ticket,
  Truck,
  Package,
  Coins,
  Percent,
  Tag,
  ShoppingBag,
  Clock,
} from 'lucide-react';

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
}

const rewardTypeConfig: Record<RewardType, { icon: React.ReactNode; label: string; color: string }> = {
  discount: { icon: <Percent className="w-4 h-4" />, label: 'Discount', color: 'bg-blue-100 text-blue-700' },
  free_shipping: { icon: <Truck className="w-4 h-4" />, label: 'Free Shipping', color: 'bg-green-100 text-green-700' },
  free_product: { icon: <Package className="w-4 h-4" />, label: 'Free Product', color: 'bg-purple-100 text-purple-700' },
  cashback: { icon: <Coins className="w-4 h-4" />, label: 'Cashback', color: 'bg-amber-100 text-amber-700' },
};

export function RewardCard({ reward, userPoints }: RewardCardProps) {
  const redeemMutation = useRedeemReward();
  const [isRedeemed, setIsRedeemed] = useState(false);

  const canAfford = userPoints >= reward.pointsCost;
  const config = rewardTypeConfig[reward.type];
  const isLimited = reward.stock !== null && reward.stock <= 10;
  const isExpired = reward.endDate ? new Date(reward.endDate) < new Date() : false;

  const handleRedeem = async () => {
    if (!canAfford) {
      toast.error(`You need ${reward.pointsCost - userPoints} more points`);
      return;
    }

    try {
      await redeemMutation.mutateAsync(reward.id);
      toast.success(`Successfully redeemed: ${reward.name}!`);
      setIsRedeemed(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to redeem reward');
    }
  };

  return (
    <Card className={`overflow-hidden transition-all ${canAfford ? 'hover:shadow-lg' : 'opacity-80'}`}>
      {/* Image */}
      <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        {reward.image ? (
          <img
            src={reward.image}
            alt={reward.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center text-muted-foreground">
            <Tag className="w-12 h-12 mb-2" />
            <span className="text-sm">{reward.name}</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge className={config.color}>
            {config.icon}
            <span className="ml-1">{config.label}</span>
          </Badge>
        </div>
        {isLimited && reward.stock !== null && (
          <div className="absolute top-2 left-2">
            <Badge variant="destructive" className="text-xs">
              Only {reward.stock} left
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-base">{reward.name}</h3>
          {reward.nameAr && (
            <p className="text-sm text-muted-foreground" dir="rtl">{reward.nameAr}</p>
          )}
          {reward.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {reward.description}
            </p>
          )}
        </div>

        {/* Reward Details */}
        <div className="space-y-1.5 mb-4">
          {reward.discountAmount && (
            <p className="text-sm">
              <span className="text-muted-foreground">Discount: </span>
              <span className="font-semibold">OMR {reward.discountAmount.toFixed(3)}</span>
            </p>
          )}
          {reward.discountPercent && (
            <p className="text-sm">
              <span className="text-muted-foreground">Discount: </span>
              <span className="font-semibold">{reward.discountPercent}% OFF</span>
            </p>
          )}
          {reward.minOrderAmount && (
            <p className="text-sm">
              <span className="text-muted-foreground">Min. Order: </span>
              <span className="font-semibold">OMR {reward.minOrderAmount.toFixed(3)}</span>
            </p>
          )}
          {reward.endDate && (
            <p className="text-sm flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              Expires {new Date(reward.endDate).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Points Cost & Action */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-yellow-600" />
            <span className="font-bold text-lg">{reward.pointsCost.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">pts</span>
          </div>

          {isRedeemed ? (
            <Badge variant="outline" className="text-green-600 border-green-300">
              Redeemed
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={handleRedeem}
              disabled={!canAfford || redeemMutation.isPending}
              variant={canAfford ? 'default' : 'outline'}
            >
              <ShoppingBag className="w-3 h-3 mr-1" />
              {redeemMutation.isPending
                ? 'Redeeming...'
                : canAfford
                ? 'Redeem'
                : `${(reward.pointsCost - userPoints).toLocaleString()} more`
              }
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
