import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { LoyaltyProgram, LoyaltyTier } from '../entities/loyalty-program.entity';
import { LoyaltyAccount } from '../entities/loyalty-account.entity';
import {
  PointsTransaction,
  PointsTransactionType,
} from '../entities/points-transaction.entity';
import { Reward } from '../entities/reward.entity';
import {
  RewardRedemption,
  RedemptionStatus,
} from '../entities/reward-redemption.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyProgram)
    private readonly programRepo: Repository<LoyaltyProgram>,
    @InjectRepository(LoyaltyAccount)
    private readonly accountRepo: Repository<LoyaltyAccount>,
    @InjectRepository(PointsTransaction)
    private readonly transactionRepo: Repository<PointsTransaction>,
    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,
    @InjectRepository(RewardRedemption)
    private readonly redemptionRepo: Repository<RewardRedemption>,
  ) {}

  /**
   * Create a loyalty account for a new user with welcome bonus
   */
  async createAccount(userId: string, referredByCode?: string): Promise<LoyaltyAccount> {
    // Check if account already exists
    const existing = await this.accountRepo.findOne({ where: { userId } });
    if (existing) {
      throw new BadRequestException('Loyalty account already exists for this user');
    }

    // Get active program
    const program = await this.getActiveProgram();

    // Generate referral code
    const referralCode = this.generateReferralCode();

    // Handle referral
    let referredBy: string | null = null;
    if (referredByCode) {
      const referrer = await this.accountRepo.findOne({
        where: { referralCode: referredByCode },
      });
      if (referrer) {
        referredBy = referrer.userId;
        // Award referral bonus to referrer
        await this.addPoints(
          referrer.id,
          program.referralBonus,
          PointsTransactionType.REFERRAL,
          `Referral bonus for inviting user ${userId.slice(0, 8)}...`,
        );
      }
    }

    // Create account
    const account = this.accountRepo.create({
      userId,
      referralCode,
      referredBy,
      totalPoints: program.welcomeBonus,
      availablePoints: program.welcomeBonus,
      lifetimePoints: program.welcomeBonus,
      currentTier: 'bronze',
    });

    const saved = await this.accountRepo.save(account);

    // Record welcome bonus transaction
    if (program.welcomeBonus > 0) {
      await this.transactionRepo.save({
        accountId: saved.id,
        type: PointsTransactionType.BONUS,
        points: program.welcomeBonus,
        description: 'Welcome bonus points',
        expiryDate: this.getDefaultExpiryDate(),
      });
    }

    return saved;
  }

  /**
   * Get loyalty account for a user
   */
  async getAccount(userId: string): Promise<LoyaltyAccount> {
    let account = await this.accountRepo.findOne({ where: { userId } });

    if (!account) {
      // Auto-create account if not exists
      account = await this.createAccount(userId);
    }

    return account;
  }

  /**
   * Award points for a purchase
   */
  async earnPoints(
    userId: string,
    orderId: string,
    amount: number,
  ): Promise<{ pointsEarned: number; newBalance: number }> {
    const program = await this.getActiveProgram();
    const account = await this.getAccount(userId);

    // Calculate base points
    let pointsEarned = Math.floor(amount * program.pointsPerCurrency);

    // Apply tier multiplier
    const tierMultiplier = await this.getTierMultiplier(account);
    pointsEarned = Math.floor(pointsEarned * tierMultiplier);

    // Add points to account
    await this.addPoints(
      account.id,
      pointsEarned,
      PointsTransactionType.EARN,
      `Points earned for order #${orderId.slice(0, 8)}`,
      orderId,
    );

    // Recalculate tier
    await this.calculateTier(userId);

    // Get updated account
    const updated = await this.getAccount(userId);

    return { pointsEarned, newBalance: updated.availablePoints };
  }

  /**
   * Redeem points for a reward
   */
  async redeemPoints(
    userId: string,
    rewardId: string,
  ): Promise<{ redemption: RewardRedemption; remainingPoints: number }> {
    const account = await this.getAccount(userId);
    const reward = await this.rewardRepo.findOne({ where: { id: rewardId, active: true } });

    if (!reward) {
      throw new NotFoundException('Reward not found or inactive');
    }

    // Check if reward is in stock
    if (reward.stock !== null && reward.stock <= 0) {
      throw new BadRequestException('This reward is out of stock');
    }
    
    // Check date validity
    const now = new Date();
    if (reward.startDate > now) {
      throw new BadRequestException('This reward is not yet available');
    }
    if (reward.endDate && reward.endDate < now) {
      throw new BadRequestException('This reward has expired');
    }

    // Check points balance
    if (account.availablePoints < reward.pointsCost) {
      throw new BadRequestException(
        `Insufficient points. You have ${account.availablePoints} points, but this reward costs ${reward.pointsCost} points.`,
      );
    }

    // Deduct points
    const updatedPoints = account.availablePoints - reward.pointsCost;
    await this.accountRepo.update(account.id, {
      availablePoints: updatedPoints,
      totalPoints: account.totalPoints - reward.pointsCost,
      redeemedPoints: account.redeemedPoints + reward.pointsCost,
    });

    // Record redemption transaction
    await this.transactionRepo.save({
      accountId: account.id,
      type: PointsTransactionType.REDEEM,
      points: -reward.pointsCost,
      description: `Redeemed: ${reward.name}`,
    });

    // Generate unique redemption code
    const code = this.generateRedemptionCode();

    // Create redemption record
    const redemption = this.redemptionRepo.create({
      accountId: account.id,
      rewardId: reward.id,
      pointsUsed: reward.pointsCost,
      status: RedemptionStatus.PENDING,
      code,
    });

    const savedRedemption = await this.redemptionRepo.save(redemption);

    // Decrease stock if applicable
    if (reward.stock !== null) {
      await this.rewardRepo.update(reward.id, {
        stock: reward.stock - 1,
      });
    }

    return { redemption: savedRedemption, remainingPoints: updatedPoints };
  }

  /**
   * Get available rewards for a user
   */
  async getAvailableRewards(
    userId?: string,
    tier?: string,
  ): Promise<Reward[]> {
    const now = new Date();

    const query = this.rewardRepo.createQueryBuilder('reward')
      .where('reward.active = :active', { active: true })
      .andWhere('reward.startDate <= :now', { now })
      .andWhere('(reward.endDate IS NULL OR reward.endDate >= :now)', { now })
      .andWhere('(reward.stock IS NULL OR reward.stock > 0)');

    // If userId provided, filter by affordable rewards
    if (userId) {
      const account = await this.getAccount(userId);
      query.andWhere('reward.pointsCost <= :points', {
        points: account.availablePoints,
      });
    }

    return query.orderBy('reward.pointsCost', 'ASC').getMany();
  }

  /**
   * Get points transaction history
   */
  async getTransactions(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: PointsTransaction[]; total: number }> {
    const account = await this.getAccount(userId);

    const [items, total] = await this.transactionRepo.findAndCount({
      where: { accountId: account.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total };
  }

  /**
   * Calculate and update user tier based on lifetime points
   */
  async calculateTier(userId: string): Promise<{ tier: string; tierData: LoyaltyTier | null }> {
    const program = await this.getActiveProgram();
    const account = await this.getAccount(userId);

    if (!program.tiers || program.tiers.length === 0) {
      return { tier: account.currentTier, tierData: null };
    }

    // Sort tiers by minPoints descending
    const sortedTiers = [...program.tiers].sort(
      (a, b) => b.minPoints - a.minPoints,
    );

    // Find the highest tier the user qualifies for
    const qualifyingTier = sortedTiers.find(
      (t) => account.lifetimePoints >= t.minPoints,
    );

    const newTier = qualifyingTier ? qualifyingTier.name : sortedTiers[sortedTiers.length - 1]?.name || 'bronze';

    if (newTier !== account.currentTier) {
      await this.accountRepo.update(account.id, {
        currentTier: newTier,
      });

      // Record tier change as bonus transaction
      await this.transactionRepo.save({
        accountId: account.id,
        type: PointsTransactionType.BONUS,
        points: 0,
        description: `Tier upgraded to ${newTier}!`,
      });
    }

    return { tier: newTier, tierData: qualifyingTier || null };
  }

  /**
   * Apply a referral code
   */
  async applyReferral(
    referralCode: string,
    newUserId: string,
  ): Promise<{ success: boolean; bonus: number }> {
    // Check if user already has an account
    const existingAccount = await this.accountRepo.findOne({
      where: { userId: newUserId },
    });

    if (existingAccount?.referredBy) {
      throw new BadRequestException('You have already applied a referral code');
    }

    // Find referrer
    const referrer = await this.accountRepo.findOne({
      where: { referralCode },
    });

    if (!referrer) {
      throw new NotFoundException('Invalid referral code');
    }

    if (referrer.userId === newUserId) {
      throw new BadRequestException('You cannot refer yourself');
    }

    const program = await this.getActiveProgram();

    // Update new user's account with referrer
    if (existingAccount) {
      await this.accountRepo.update(existingAccount.id, {
        referredBy: referrer.userId,
      });
    }

    return { success: true, bonus: program.referralBonus };
  }

  /**
   * Get user's referral code
   */
  async getReferralCode(userId: string): Promise<{ code: string; url: string }> {
    const account = await this.getAccount(userId);
    return {
      code: account.referralCode,
      url: `${process.env.FRONTEND_URL}/register?ref=${account.referralCode}`,
    };
  }

  /**
   * Get points balance
   */
  async getPointsBalance(userId: string): Promise<{
    available: number;
    total: number;
    lifetime: number;
    redeemed: number;
    tier: string;
  }> {
    const account = await this.getAccount(userId);
    return {
      available: account.availablePoints,
      total: account.totalPoints,
      lifetime: account.lifetimePoints,
      redeemed: account.redeemedPoints,
      tier: account.currentTier,
    };
  }

  /**
   * Cron job: Expire old points daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireOldPoints(): Promise<void> {
    const now = new Date();

    // Find transactions with expiry dates that have passed
    const expiredTransactions = await this.transactionRepo.find({
      where: {
        expiryDate: LessThan(now),
        type: PointsTransactionType.EARN,
      },
    });

    for (const tx of expiredTransactions) {
      const account = await this.accountRepo.findOne({
        where: { id: tx.accountId },
      });

      if (account && account.availablePoints >= tx.points) {
        // Deduct expired points
        await this.accountRepo.update(account.id, {
          availablePoints: account.availablePoints - tx.points,
          totalPoints: account.totalPoints - tx.points,
        });

        // Record expiration transaction
        await this.transactionRepo.save({
          accountId: account.id,
          type: PointsTransactionType.EXPIRE,
          points: -tx.points,
          description: `Points expired: ${tx.description}`,
        });
      }
    }
  }

  // ============ Admin Methods ============

  /**
   * Create or update loyalty program
   */
  async upsertProgram(data: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
    let program = await this.programRepo.findOne({ where: { active: true } });

    if (!program) {
      program = this.programRepo.create(data);
    } else {
      Object.assign(program, data);
    }

    return this.programRepo.save(program);
  }

  /**
   * Create a reward
   */
  async createReward(data: Partial<Reward>): Promise<Reward> {
    const reward = this.rewardRepo.create(data);
    return this.rewardRepo.save(reward);
  }

  /**
   * Update a reward
   */
  async updateReward(id: string, data: Partial<Reward>): Promise<Reward> {
    const reward = await this.rewardRepo.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    Object.assign(reward, data);
    return this.rewardRepo.save(reward);
  }

  /**
   * Delete a reward
   */
  async deleteReward(id: string): Promise<void> {
    const reward = await this.rewardRepo.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    await this.rewardRepo.remove(reward);
  }

  /**
   * Get all rewards (admin)
   */
  async getAllRewards(): Promise<Reward[]> {
    return this.rewardRepo.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * Manually adjust points (admin)
   */
  async adjustPoints(
    userId: string,
    points: number,
    reason: string,
  ): Promise<LoyaltyAccount> {
    const account = await this.getAccount(userId);

    await this.addPoints(
      account.id,
      points,
      PointsTransactionType.ADJUSTMENT,
      reason,
    );

    return this.getAccount(userId);
  }

  // ============ Private Helpers ============

  private async getActiveProgram(): Promise<LoyaltyProgram> {
    let program = await this.programRepo.findOne({ where: { active: true } });

    if (!program) {
      // Create default program
      program = this.programRepo.create({
        name: 'BHD Rewards',
        description: 'Earn points on every purchase and redeem for rewards.',
        pointsPerCurrency: 1,
        currencyPerPoint: 0.01,
        welcomeBonus: 100,
        referralBonus: 50,
        active: true,
        tiers: [
          {
            name: 'bronze',
            nameAr: 'برونزية',
            minPoints: 0,
            multiplier: 1,
            benefits: ['Earn 1 point per OMR spent'],
            color: '#CD7F32',
            icon: 'award',
          },
          {
            name: 'silver',
            nameAr: 'فضية',
            minPoints: 1000,
            multiplier: 1.25,
            benefits: ['1.25x points multiplier', 'Early access to sales'],
            color: '#C0C0C0',
            icon: 'star',
          },
          {
            name: 'gold',
            nameAr: 'ذهبية',
            minPoints: 5000,
            multiplier: 1.5,
            benefits: ['1.5x points multiplier', 'Free shipping', 'Birthday bonus'],
            color: '#FFD700',
            icon: 'crown',
          },
          {
            name: 'platinum',
            nameAr: 'بلاتينية',
            minPoints: 15000,
            multiplier: 2,
            benefits: ['2x points multiplier', 'Free shipping', 'Priority support', 'Exclusive deals'],
            color: '#E5E4E2',
            icon: 'gem',
          },
        ],
      });
      program = await this.programRepo.save(program);
    }

    return program;
  }

  private async addPoints(
    accountId: string,
    points: number,
    type: PointsTransactionType,
    description: string,
    orderId?: string,
  ): Promise<void> {
    // Create transaction record
    await this.transactionRepo.save({
      accountId,
      type,
      points,
      description,
      orderId,
      expiryDate: type === PointsTransactionType.EARN ? this.getDefaultExpiryDate() : null,
    });

    // Update account balance
    const account = await this.accountRepo.findOne({ where: { id: accountId } });
    if (account) {
      const isAddition = points > 0;
      await this.accountRepo.update(accountId, {
        totalPoints: isAddition
          ? account.totalPoints + points
          : account.totalPoints,
        availablePoints: account.availablePoints + points,
        lifetimePoints: isAddition
          ? account.lifetimePoints + points
          : account.lifetimePoints,
      });
    }
  }

  private async getTierMultiplier(account: LoyaltyAccount): Promise<number> {
    const program = await this.getActiveProgram();
    const tier = program.tiers?.find((t) => t.name === account.currentTier);
    return tier?.multiplier || 1;
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'BHD';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateRedemptionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private getDefaultExpiryDate(): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1); // Points expire after 1 year
    return date;
  }
}
