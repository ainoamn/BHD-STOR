import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { Achievement, AchievementConditionType } from '../entities/achievement.entity';
import { UserAchievement } from '../entities/user-achievement.entity';
import { LeaderboardEntry, LeaderboardPeriod } from '../entities/leaderboard-entry.entity';
import { Badge } from '../entities/badge.entity';
import { UserBadge } from '../entities/user-badge.entity';
import { Challenge } from '../entities/challenge.entity';
import { ChallengeParticipant } from '../entities/challenge-participant.entity';

export interface UserGamificationStats {
  totalPoints: number;
  rank: number;
  achievementsCount: number;
  totalAchievements: number;
  badgesCount: number;
  currentStreak: number;
  level: number;
  xpToNextLevel: number;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectRepository(Achievement)
    private achievementRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private userAchievementRepo: Repository<UserAchievement>,
    @InjectRepository(LeaderboardEntry)
    private leaderboardRepo: Repository<LeaderboardEntry>,
    @InjectRepository(Badge)
    private badgeRepo: Repository<Badge>,
    @InjectRepository(UserBadge)
    private userBadgeRepo: Repository<UserBadge>,
    @InjectRepository(Challenge)
    private challengeRepo: Repository<Challenge>,
    @InjectRepository(ChallengeParticipant)
    private challengeParticipantRepo: Repository<ChallengeParticipant>,
  ) {}

  // ─── Achievement System ───────────────────────────────────────────

  async checkAchievements(userId: string): Promise<UserAchievement[]> {
    const userAchievements = await this.userAchievementRepo.find({
      where: { userId },
      relations: ['achievement'],
    });

    const newlyCompleted: UserAchievement[] = [];

    for (const ua of userAchievements) {
      if (!ua.completed && ua.progress >= ua.target) {
        ua.completed = true;
        ua.completedAt = new Date();
        await this.userAchievementRepo.save(ua);
        newlyCompleted.push(ua);

        // Award achievement points
        if (ua.achievement.pointsAwarded > 0) {
          await this.awardPoints(
            userId,
            ua.achievement.pointsAwarded,
            `Achievement unlocked: ${ua.achievement.name}`,
          );
        }

        // Award associated badge if any
        const badge = await this.badgeRepo.findOne({
          where: { code: ua.achievement.code },
        });
        if (badge) {
          await this.awardBadge(userId, badge.id);
        }
      }
    }

    return newlyCompleted;
  }

  async trackProgress(
    userId: string,
    action: string,
    value: number = 1,
  ): Promise<UserAchievement[]> {
    // Find achievements matching this action
    const achievements = await this.achievementRepo.find({
      where: { conditionEntity: action },
    });

    const newlyCreated: UserAchievement[] = [];

    for (const achievement of achievements) {
      let userAchievement = await this.userAchievementRepo.findOne({
        where: { userId, achievementId: achievement.id },
      });

      if (!userAchievement) {
        userAchievement = this.userAchievementRepo.create({
          userId,
          achievementId: achievement.id,
          progress: 0,
          target: achievement.conditionValue,
          completed: false,
        });
      }

      // Update progress based on condition type
      switch (achievement.conditionType) {
        case AchievementConditionType.COUNT:
          userAchievement.progress += value;
          break;
        case AchievementConditionType.AMOUNT:
          userAchievement.progress += value;
          break;
        case AchievementConditionType.STREAK:
          userAchievement.progress = Math.max(userAchievement.progress, value);
          break;
        case AchievementConditionType.FIRST_TIME:
          userAchievement.progress = 1;
          break;
        case AchievementConditionType.SOCIAL:
          userAchievement.progress += value;
          break;
      }

      const saved = await this.userAchievementRepo.save(userAchievement);
      newlyCreated.push(saved);
    }

    // Check for completions
    const completed = await this.checkAchievements(userId);

    // Update leaderboard
    await this.updateLeaderboardEntry(userId);

    return completed.length > 0 ? completed : newlyCreated;
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return this.userAchievementRepo.find({
      where: { userId },
      relations: ['achievement'],
      order: { completedAt: 'DESC' },
    });
  }

  // ─── Leaderboard System ───────────────────────────────────────────

  async getLeaderboard(
    period: LeaderboardPeriod,
    limit: number = 50,
  ): Promise<LeaderboardEntry[]> {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (period) {
      case LeaderboardPeriod.DAILY:
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case LeaderboardPeriod.WEEKLY:
        const dayOfWeek = now.getDay();
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 7);
        break;
      case LeaderboardPeriod.MONTHLY:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case LeaderboardPeriod.ALL_TIME:
        periodStart = new Date(0);
        periodEnd = new Date(8640000000000000);
        break;
    }

    const entries = await this.leaderboardRepo.find({
      where: {
        period,
        periodStart: Between(periodStart, periodEnd),
      },
      order: { points: 'DESC' },
      take: limit,
    });

    // Update ranks
    for (let i = 0; i < entries.length; i++) {
      entries[i].rank = i + 1;
      await this.leaderboardRepo.save(entries[i]);
    }

    return entries;
  }

  async updateLeaderboardEntry(userId: string): Promise<void> {
    const now = new Date();
    const periods = [
      { period: LeaderboardPeriod.DAILY, start: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      { period: LeaderboardPeriod.WEEKLY, start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()) },
      { period: LeaderboardPeriod.MONTHLY, start: new Date(now.getFullYear(), now.getMonth(), 1) },
      { period: LeaderboardPeriod.ALL_TIME, start: new Date(0) },
    ];

    // Calculate total points from completed achievements
    const userAchievements = await this.userAchievementRepo.find({
      where: { userId, completed: true },
      relations: ['achievement'],
    });

    const totalPoints = userAchievements.reduce(
      (sum, ua) => sum + (ua.achievement?.pointsAwarded || 0),
      0,
    );

    for (const { period, start } of periods) {
      let entry = await this.leaderboardRepo.findOne({
        where: {
          userId,
          period,
          periodStart: start,
        },
      });

      if (!entry) {
        entry = this.leaderboardRepo.create({
          userId,
          period,
          points: 0,
          rank: 0,
          periodStart: start,
          periodEnd: new Date(start.getTime() + 86400000 * (period === LeaderboardPeriod.WEEKLY ? 7 : period === LeaderboardPeriod.MONTHLY ? 30 : 1)),
        });
      }

      entry.points = totalPoints;
      await this.leaderboardRepo.save(entry);
    }
  }

  // ─── Badge System ─────────────────────────────────────────────────

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.userBadgeRepo.find({
      where: { userId },
      relations: ['badge'],
      order: { earnedAt: 'DESC' },
    });
  }

  async awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
    const existing = await this.userBadgeRepo.findOne({
      where: { userId, badgeId },
    });

    if (existing) {
      return existing;
    }

    const userBadge = this.userBadgeRepo.create({
      userId,
      badgeId,
      equipped: true,
    });

    return this.userBadgeRepo.save(userBadge);
  }

  async equipBadge(userId: string, badgeId: string): Promise<UserBadge> {
    // Unequip all other badges first
    await this.userBadgeRepo.update(
      { userId },
      { equipped: false },
    );

    const userBadge = await this.userBadgeRepo.findOne({
      where: { userId, badgeId },
    });

    if (!userBadge) {
      throw new NotFoundException('Badge not found for user');
    }

    userBadge.equipped = true;
    return this.userBadgeRepo.save(userBadge);
  }

  // ─── Challenge System ─────────────────────────────────────────────

  async getActiveChallenges(): Promise<Challenge[]> {
    const now = new Date();
    return this.challengeRepo.find({
      where: {
        active: true,
        startDate: LessThan(now),
        endDate: MoreThan(now),
      },
      order: { endDate: 'ASC' },
    });
  }

  async joinChallenge(userId: string, challengeId: string): Promise<ChallengeParticipant> {
    const challenge = await this.challengeRepo.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (!challenge.active) {
      throw new Error('Challenge is not active');
    }

    const now = new Date();
    if (now < challenge.startDate || now > challenge.endDate) {
      throw new Error('Challenge is not currently running');
    }

    if (challenge.maxParticipants && challenge.participants >= challenge.maxParticipants) {
      throw new Error('Challenge is full');
    }

    const existing = await this.challengeParticipantRepo.findOne({
      where: { userId, challengeId },
    });

    if (existing) {
      return existing;
    }

    // Increment participant count
    challenge.participants += 1;
    await this.challengeRepo.save(challenge);

    const participant = this.challengeParticipantRepo.create({
      userId,
      challengeId,
      progress: 0,
      completed: false,
    });

    return this.challengeParticipantRepo.save(participant);
  }

  async getUserChallenges(userId: string): Promise<ChallengeParticipant[]> {
    return this.challengeParticipantRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Points System ────────────────────────────────────────────────

  async awardPoints(
    userId: string,
    points: number,
    reason: string,
  ): Promise<LeaderboardEntry> {
    this.logger.log(`Awarding ${points} points to user ${userId}: ${reason}`);

    // Update all leaderboard periods
    await this.updateLeaderboardEntry(userId);

    // Get the all-time entry to return
    const now = new Date();
    let entry = await this.leaderboardRepo.findOne({
      where: {
        userId,
        period: LeaderboardPeriod.ALL_TIME,
      },
    });

    if (!entry) {
      entry = this.leaderboardRepo.create({
        userId,
        period: LeaderboardPeriod.ALL_TIME,
        points: 0,
        rank: 0,
        periodStart: new Date(0),
        periodEnd: new Date(8640000000000000),
      });
    }

    entry.points += points;
    return this.leaderboardRepo.save(entry);
  }

  // ─── User Stats ───────────────────────────────────────────────────

  async getUserStats(userId: string): Promise<UserGamificationStats> {
    const userAchievements = await this.userAchievementRepo.find({
      where: { userId },
      relations: ['achievement'],
    });

    const completedAchievements = userAchievements.filter((ua) => ua.completed);
    const totalPoints = completedAchievements.reduce(
      (sum, ua) => sum + (ua.achievement?.pointsAwarded || 0),
      0,
    );

    const badges = await this.userBadgeRepo.find({ where: { userId } });

    // Calculate level based on points (100 points per level)
    const level = Math.floor(totalPoints / 100) + 1;
    const xpToNextLevel = level * 100 - totalPoints;

    // Get rank
    const leaderboardEntry = await this.leaderboardRepo.findOne({
      where: { userId, period: LeaderboardPeriod.ALL_TIME },
    });

    const totalAchievements = await this.achievementRepo.count();

    return {
      totalPoints,
      rank: leaderboardEntry?.rank || 0,
      achievementsCount: completedAchievements.length,
      totalAchievements,
      badgesCount: badges.length,
      currentStreak: this.calculateStreak(completedAchievements),
      level,
      xpToNextLevel,
    };
  }

  private calculateStreak(achievements: UserAchievement[]): number {
    if (achievements.length === 0) return 0;

    const sortedDates = achievements
      .filter((a) => a.completedAt)
      .map((a) => new Date(a.completedAt!).toDateString())
      .sort();

    if (sortedDates.length === 0) return 0;

    let streak = 1;
    for (let i = sortedDates.length - 1; i > 0; i--) {
      const current = new Date(sortedDates[i]);
      const previous = new Date(sortedDates[i - 1]);
      const diffDays = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays <= 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // ─── Admin/Setup ──────────────────────────────────────────────────

  async createAchievement(data: Partial<Achievement>): Promise<Achievement> {
    const achievement = this.achievementRepo.create(data);
    return this.achievementRepo.save(achievement);
  }

  async createBadge(data: Partial<Badge>): Promise<Badge> {
    const badge = this.badgeRepo.create(data);
    return this.badgeRepo.save(badge);
  }

  async createChallenge(data: Partial<Challenge>): Promise<Challenge> {
    const challenge = this.challengeRepo.create(data);
    return this.challengeRepo.save(challenge);
  }

  async seedAchievements(): Promise<void> {
    const defaultAchievements: Partial<Achievement>[] = [
      {
        code: 'first_order',
        name: 'First Order',
        nameAr: 'أول طلب',
        description: 'Place your first order',
        descriptionAr: 'قم بتقديم طلبك الأول',
        category: 'orders' as const,
        icon: '/assets/icons/order-first.svg',
        color: '#10B981',
        pointsAwarded: 50,
        conditionType: AchievementConditionType.FIRST_TIME,
        conditionValue: 1,
        conditionEntity: 'orders',
      },
      {
        code: 'order_10',
        name: 'Regular Customer',
        nameAr: 'عميل منتظم',
        description: 'Place 10 orders',
        descriptionAr: 'قدم 10 طلبات',
        category: 'orders' as const,
        icon: '/assets/icons/order-10.svg',
        color: '#3B82F6',
        pointsAwarded: 200,
        conditionType: AchievementConditionType.COUNT,
        conditionValue: 10,
        conditionEntity: 'orders',
      },
      {
        code: 'order_50',
        name: 'Loyal Customer',
        nameAr: 'عميل وفير',
        description: 'Place 50 orders',
        descriptionAr: 'قدم 50 طلبًا',
        category: 'orders' as const,
        icon: '/assets/icons/order-50.svg',
        color: '#8B5CF6',
        pointsAwarded: 1000,
        conditionType: AchievementConditionType.COUNT,
        conditionValue: 50,
        conditionEntity: 'orders',
      },
      {
        code: 'first_review',
        name: 'First Review',
        nameAr: 'أول مراجعة',
        description: 'Write your first review',
        descriptionAr: 'اكتب مراجعتك الأولى',
        category: 'reviews' as const,
        icon: '/assets/icons/review-first.svg',
        color: '#F59E0B',
        pointsAwarded: 30,
        conditionType: AchievementConditionType.FIRST_TIME,
        conditionValue: 1,
        conditionEntity: 'reviews',
      },
      {
        code: 'review_10',
        name: 'Critic',
        nameAr: 'ناقد',
        description: 'Write 10 reviews',
        descriptionAr: 'اكتب 10 مراجعات',
        category: 'reviews' as const,
        icon: '/assets/icons/review-10.svg',
        color: '#EF4444',
        pointsAwarded: 150,
        conditionType: AchievementConditionType.COUNT,
        conditionValue: 10,
        conditionEntity: 'reviews',
      },
      {
        code: 'streak_7',
        name: 'Week Warrior',
        nameAr: 'محارب الأسبوع',
        description: 'Maintain a 7-day streak',
        descriptionAr: 'حافظ على تسلسل 7 أيام',
        category: 'streak' as const,
        icon: '/assets/icons/streak-7.svg',
        color: '#EC4899',
        pointsAwarded: 300,
        conditionType: AchievementConditionType.STREAK,
        conditionValue: 7,
        conditionEntity: 'orders',
        isSecret: false,
      },
      {
        code: 'streak_30',
        name: 'Monthly Master',
        nameAr: 'سيد الشهر',
        description: 'Maintain a 30-day streak',
        descriptionAr: 'حافظ على تسلسل 30 يومًا',
        category: 'streak' as const,
        icon: '/assets/icons/streak-30.svg',
        color: '#DC2626',
        pointsAwarded: 1000,
        conditionType: AchievementConditionType.STREAK,
        conditionValue: 30,
        conditionEntity: 'orders',
        isSecret: false,
      },
      {
        code: 'explorer',
        name: 'Explorer',
        nameAr: 'مستكشف',
        description: 'Browse 50 different products',
        descriptionAr: 'تصفح 50 منتجًا مختلفًا',
        category: 'exploration' as const,
        icon: '/assets/icons/explorer.svg',
        color: '#06B6D4',
        pointsAwarded: 100,
        conditionType: AchievementConditionType.COUNT,
        conditionValue: 50,
        conditionEntity: 'product_views',
      },
      {
        code: 'social_share',
        name: 'Social Butterfly',
        nameAr: 'فراشة اجتماعية',
        description: 'Share 5 products on social media',
        descriptionAr: 'شارك 5 منتجات على وسائل التواصل',
        category: 'social' as const,
        icon: '/assets/icons/social.svg',
        color: '#8B5CF6',
        pointsAwarded: 100,
        conditionType: AchievementConditionType.COUNT,
        conditionValue: 5,
        conditionEntity: 'social_shares',
      },
    ];

    for (const achievement of defaultAchievements) {
      const existing = await this.achievementRepo.findOne({
        where: { code: achievement.code },
      });
      if (!existing) {
        await this.createAchievement(achievement);
      }
    }
  }
}
