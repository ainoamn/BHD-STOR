'use client';

import { LoyaltyTier } from '@/services/loyalty.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import {
  Award,
  Star,
  Crown,
  Gem,
  ArrowRight,
  Zap,
  Lock,
  CheckCircle,
} from 'lucide-react';

interface TierProgressProps {
  currentTier: string;
  lifetimePoints: number;
  tiers?: LoyaltyTier[];
}

const tierIcons: Record<string, React.ReactNode> = {
  bronze: <Award className="w-5 h-5" />,
  silver: <Star className="w-5 h-5" />,
  gold: <Crown className="w-5 h-5" />,
  platinum: <Gem className="w-5 h-5" />,
};

const defaultTiers: LoyaltyTier[] = [
  { name: 'bronze', nameAr: 'برونزية', minPoints: 0, multiplier: 1, benefits: ['Earn 1 point per OMR spent'], color: '#CD7F32' },
  { name: 'silver', nameAr: 'فضية', minPoints: 1000, multiplier: 1.25, benefits: ['1.25x points multiplier', 'Early access to sales'], color: '#C0C0C0' },
  { name: 'gold', nameAr: 'ذهبية', minPoints: 5000, multiplier: 1.5, benefits: ['1.5x points multiplier', 'Free shipping', 'Birthday bonus'], color: '#FFD700' },
  { name: 'platinum', nameAr: 'بلاتينية', minPoints: 15000, multiplier: 2, benefits: ['2x points multiplier', 'Free shipping', 'Priority support', 'Exclusive deals'], color: '#E5E4E2' },
];

export function TierProgress({ currentTier, lifetimePoints, tiers }: TierProgressProps) {
  const sortedTiers = (tiers && tiers.length > 0 ? tiers : defaultTiers)
    .sort((a, b) => a.minPoints - b.minPoints);

  const currentTierIndex = sortedTiers.findIndex(
    (t) => t.name.toLowerCase() === currentTier.toLowerCase()
  );
  const currentTierData = sortedTiers[currentTierIndex] || sortedTiers[0];

  // Determine next tier
  const nextTierIndex = currentTierIndex + 1;
  const nextTier = sortedTiers[nextTierIndex];

  // Calculate progress to next tier
  let progressPercent = 100;
  let pointsToNext = 0;
  let progressMessage = 'You have reached the highest tier!';

  if (nextTier) {
    const range = nextTier.minPoints - currentTierData.minPoints;
    const earnedInTier = lifetimePoints - currentTierData.minPoints;
    progressPercent = Math.min(100, Math.max(0, (earnedInTier / range) * 100));
    pointsToNext = nextTier.minPoints - lifetimePoints;
    progressMessage = `${pointsToNext.toLocaleString()} points to ${nextTier.name}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Tier Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Tier Badge */}
        <div className="flex items-center justify-center">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold capitalize"
            style={{ backgroundColor: currentTierData.color || '#CD7F32' }}
          >
            {tierIcons[currentTierData.name.toLowerCase()] || <Award className="w-5 h-5" />}
            {currentTierData.name} Member
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {lifetimePoints.toLocaleString()} pts
            </span>
            <span className="font-medium">
              {nextTier ? `${nextTier.minPoints.toLocaleString()} pts` : 'Max'}
            </span>
          </div>
          <div className="relative">
            <Progress value={progressPercent} className="h-3" />
            {nextTier && (
              <div className="mt-1.5 text-center">
                <span className="text-xs text-muted-foreground">
                  {progressMessage}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tier Roadmap */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Tier Benefits
          </h4>
          <div className="space-y-2">
            {sortedTiers.map((tier, idx) => {
              const isActive = tier.name.toLowerCase() === currentTier.toLowerCase();
              const isUnlocked = lifetimePoints >= tier.minPoints;

              return (
                <div
                  key={tier.name}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary/5 border border-primary/20'
                      : isUnlocked
                      ? 'bg-muted/50'
                      : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-full shrink-0 ${
                      isUnlocked ? 'text-white' : 'text-gray-400 bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: isUnlocked ? tier.color || '#666' : undefined,
                    }}
                  >
                    {isUnlocked ? (
                      tierIcons[tier.name.toLowerCase()] || <Award className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold capitalize text-sm ${isActive ? 'text-primary' : ''}`}>
                        {tier.name}
                      </p>
                      {isActive && (
                        <Badge variant="outline" className="text-xs bg-primary/10">
                          Current
                        </Badge>
                      )}
                      {!isUnlocked && (
                        <span className="text-xs text-muted-foreground">
                          ({tier.minPoints.toLocaleString()} pts)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-muted-foreground">
                        {tier.multiplier}x points multiplier
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tier.benefits.map((benefit, bIdx) => (
                        <span
                          key={bIdx}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isUnlocked
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {isUnlocked && <CheckCircle className="w-2.5 h-2.5 inline mr-0.5" />}
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
