'use client';

import { PointsTransaction, PointsTransactionType } from '@/services/loyalty.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Clock,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  UserPlus,
  Settings,
} from 'lucide-react';

interface PointsHistoryProps {
  transactions: PointsTransaction[];
  isLoading?: boolean;
}

const typeConfig: Record<PointsTransactionType, { icon: React.ReactNode; color: string; bg: string }> = {
  earn: { icon: <ArrowDownLeft className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-50' },
  redeem: { icon: <ArrowUpRight className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50' },
  expire: { icon: <Clock className="w-4 h-4" />, color: 'text-gray-600', bg: 'bg-gray-50' },
  bonus: { icon: <Gift className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50' },
  adjustment: { icon: <Settings className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
  referral: { icon: <UserPlus className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
};

export function PointsHistory({ transactions, isLoading }: PointsHistoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Points History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start shopping to earn points!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Points History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {transactions.map((tx) => {
          const config = typeConfig[tx.type] || typeConfig.adjustment;
          const isPositive = tx.points > 0;

          return (
            <div
              key={tx.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={`p-2 rounded-full ${config.bg} ${config.color}`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="capitalize">{tx.type}</span>
                  <span>·</span>
                  <span>{formatDate(tx.createdAt)}</span>
                  {tx.orderId && (
                    <>
                      <span>·</span>
                      <span>Order #{tx.orderId.slice(0, 8)}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{tx.points.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">pts</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
