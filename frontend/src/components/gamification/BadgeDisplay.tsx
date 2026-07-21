'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, Crown, Star, Diamond, Shield } from 'lucide-react';

export enum BadgeRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

interface Badge {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  description: string;
  icon: string;
  color: string;
  rarity: BadgeRarity;
}

interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  equipped: boolean;
  earnedAt: string;
  badge: Badge;
}

interface BadgeDisplayProps {
  userBadges: UserBadge[];
  onEquip?: (badgeId: string) => void;
  showEmpty?: boolean;
}

const rarityConfig: Record<BadgeRarity, { label: string; color: string; bgColor: string; icon: React.ReactNode; borderColor: string }> = {
  [BadgeRarity.COMMON]: {
    label: 'Common',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300',
    icon: <Shield className="w-5 h-5" />,
  },
  [BadgeRarity.RARE]: {
    label: 'Rare',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    borderColor: 'border-blue-400',
    icon: <Star className="w-5 h-5" />,
  },
  [BadgeRarity.EPIC]: {
    label: 'Epic',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    borderColor: 'border-purple-400',
    icon: <Diamond className="w-5 h-5" />,
  },
  [BadgeRarity.LEGENDARY]: {
    label: 'Legendary',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    borderColor: 'border-yellow-400',
    icon: <Crown className="w-5 h-5" />,
  },
};

export function BadgeDisplay({ userBadges, onEquip, showEmpty = true }: BadgeDisplayProps) {
  if (!userBadges || userBadges.length === 0) {
    if (!showEmpty) return null;
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Award className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No badges earned yet</p>
        <p className="text-xs mt-1">Complete achievements to earn badges</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {userBadges.map((ub, index) => {
        const config = rarityConfig[ub.badge.rarity] || rarityConfig[BadgeRarity.COMMON];

        return (
          <motion.div
            key={ub.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -4 }}
            onClick={() => onEquip?.(ub.badgeId)}
            className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
              ub.equipped ? config.borderColor : 'border-transparent'
            } ${config.bgColor} hover:shadow-lg`}
          >
            {/* Equipped indicator */}
            {ub.equipped && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md">
                <Crown className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Badge Icon */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-inner"
              style={{ backgroundColor: ub.badge.color + '30' }}
            >
              <Award className="w-8 h-8" style={{ color: ub.badge.color }} />
            </div>

            {/* Badge Name */}
            <span className="text-xs font-semibold text-center truncate w-full">
              {ub.badge.name}
            </span>

            {/* Rarity */}
            <span className={`text-[10px] font-medium mt-1 ${config.color}`}>
              {config.label}
            </span>

            {/* Earned Date */}
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {new Date(ub.earnedAt).toLocaleDateString()}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

export function BadgeRarityBadge({ rarity }: { rarity: BadgeRarity }) {
  const config = rarityConfig[rarity] || rarityConfig[BadgeRarity.COMMON];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}
