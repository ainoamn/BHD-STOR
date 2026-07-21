import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { User } from '../users/entities/user.entity';
import { SubscribeDto, UpgradeSubscriptionDto } from './dto/subscribe.dto';
import { SubscriptionPlanType, BillingCycle } from './dto/create-subscription-plan.dto';

export interface SubscriptionWithPlan extends Subscription {
  planDetails?: SubscriptionPlan;
}

export interface FeatureAccessResult {
  hasAccess: boolean;
  feature: string;
  currentPlan: SubscriptionPlanType;
  requiredPlan?: SubscriptionPlanType;
  message: string;
}

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get all subscription plans with features
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepository.find({
      where: { isActive: true },
      order: { tier: 'ASC', price: 'ASC' },
    });
  }

  /**
   * Get a specific plan by type
   */
  async getPlanByType(planType: SubscriptionPlanType): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({
      where: { plan: planType, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException(`Plan "${planType}" not found`);
    }

    return plan;
  }

  /**
   * Subscribe user to a plan
   */
  async subscribe(userId: string, dto: SubscribeDto): Promise<Subscription> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['subscription'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = await this.getPlanByType(dto.plan);

    // Check if user already has an active subscription
    if (user.subscription && user.subscription.status === SubscriptionStatus.ACTIVE) {
      if (user.subscription.plan === dto.plan) {
        throw new ConflictException('You are already subscribed to this plan');
      }
      // Cancel existing subscription first
      await this.cancel(userId, 'Upgrading to new plan');
    }

    // Calculate period dates
    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, dto.billingCycle);

    // Calculate price based on billing cycle
    const price = this.calculatePrice(plan.price, dto.billingCycle);

    const subscription = this.subscriptionRepository.create({
      user,
      plan: dto.plan,
      billingCycle: dto.billingCycle,
      status: SubscriptionStatus.ACTIVE,
      startDate,
      endDate,
      price,
      isAutoRenew: true,
      features: plan.features || [],
      productLimit: plan.productLimit || -1,
      storageLimit: plan.storageLimit || 0,
      commissionRate: plan.commissionRate || 0,
    });

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Cancel subscription
   */
  async cancel(userId: string, reason?: string): Promise<Subscription> {
    const subscription = await this.getSubscription(userId);

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('No active subscription to cancel');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelReason = reason || 'User cancelled';
    subscription.cancelledAt = new Date();
    subscription.isAutoRenew = false;

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Renew subscription
   */
  async renew(userId: string): Promise<Subscription> {
    const subscription = await this.getSubscription(userId);

    if (subscription.status !== SubscriptionStatus.ACTIVE &&
        subscription.status !== SubscriptionStatus.EXPIRED) {
      throw new BadRequestException('Subscription cannot be renewed');
    }

    const plan = await this.getPlanByType(subscription.plan);

    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, subscription.billingCycle);
    const price = this.calculatePrice(plan.price, subscription.billingCycle);

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.price = price;
    subscription.cancelledAt = null;
    subscription.cancelReason = null;
    subscription.isAutoRenew = true;

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Check if user has access to a feature
   */
  async checkFeatureAccess(
    userId: string,
    feature: string,
  ): Promise<FeatureAccessResult> {
    try {
      const subscription = await this.getSubscription(userId);
      const features = subscription.features || [];

      const hasAccess = features.includes(feature) ||
        subscription.plan === SubscriptionPlanType.ENTERPRISE;

      return {
        hasAccess,
        feature,
        currentPlan: subscription.plan,
        message: hasAccess
          ? 'Feature is available'
          : `Feature "${feature}" is not available on your current plan`,
      };
    } catch {
      return {
        hasAccess: false,
        feature,
        currentPlan: SubscriptionPlanType.FREE,
        message: 'No active subscription. Please subscribe to access this feature.',
      };
    }
  }

  /**
   * Get current subscription for user
   */
  async getSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    if (!subscription) {
      throw new NotFoundException('No subscription found for this user');
    }

    // Check if subscription expired
    if (
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.endDate < new Date()
    ) {
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(subscription);
    }

    return subscription;
  }

  /**
   * Get subscription status for user
   */
  async getSubscriptionStatus(userId: string): Promise<{
    hasSubscription: boolean;
    plan: SubscriptionPlanType | null;
    status: SubscriptionStatus | null;
    isActive: boolean;
    daysRemaining: number;
  }> {
    try {
      const subscription = await this.getSubscription(userId);
      const daysRemaining = Math.max(
        0,
        Math.ceil(
          (subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      );

      return {
        hasSubscription: true,
        plan: subscription.plan,
        status: subscription.status,
        isActive: subscription.status === SubscriptionStatus.ACTIVE && daysRemaining > 0,
        daysRemaining,
      };
    } catch {
      return {
        hasSubscription: false,
        plan: null,
        status: null,
        isActive: false,
        daysRemaining: 0,
      };
    }
  }

  /**
   * Upgrade subscription plan
   */
  async upgrade(userId: string, dto: UpgradeSubscriptionDto): Promise<Subscription> {
    const currentSubscription = await this.getSubscription(userId);

    // Check if upgrade is valid (new plan should be higher tier)
    const planHierarchy: Record<SubscriptionPlanType, number> = {
      [SubscriptionPlanType.FREE]: 1,
      [SubscriptionPlanType.BASIC]: 2,
      [SubscriptionPlanType.STANDARD]: 3,
      [SubscriptionPlanType.PREMIUM]: 4,
      [SubscriptionPlanType.ENTERPRISE]: 5,
    };

    const currentTier = planHierarchy[currentSubscription.plan] || 0;
    const newTier = planHierarchy[dto.newPlan] || 0;

    if (newTier <= currentTier) {
      throw new BadRequestException(
        `Cannot upgrade from ${currentSubscription.plan} to ${dto.newPlan}. Use downgrade instead.`,
      );
    }

    // Cancel current and subscribe to new
    await this.cancel(userId, `Upgrading to ${dto.newPlan}`);

    return this.subscribe(userId, {
      plan: dto.newPlan,
      billingCycle: currentSubscription.billingCycle,
      paymentMethodId: dto.paymentMethodId,
    });
  }

  /**
   * Downgrade subscription plan
   */
  async downgrade(userId: string, dto: UpgradeSubscriptionDto): Promise<Subscription> {
    const currentSubscription = await this.getSubscription(userId);

    const planHierarchy: Record<SubscriptionPlanType, number> = {
      [SubscriptionPlanType.FREE]: 1,
      [SubscriptionPlanType.BASIC]: 2,
      [SubscriptionPlanType.STANDARD]: 3,
      [SubscriptionPlanType.PREMIUM]: 4,
      [SubscriptionPlanType.ENTERPRISE]: 5,
    };

    const currentTier = planHierarchy[currentSubscription.plan] || 0;
    const newTier = planHierarchy[dto.newPlan] || 0;

    if (newTier >= currentTier) {
      throw new BadRequestException(
        `Cannot downgrade from ${currentSubscription.plan} to ${dto.newPlan}. Use upgrade instead.`,
      );
    }

    await this.cancel(userId, `Downgrading to ${dto.newPlan}`);

    return this.subscribe(userId, {
      plan: dto.newPlan,
      billingCycle: currentSubscription.billingCycle,
      paymentMethodId: dto.paymentMethodId,
    });
  }

  /**
   * Calculate subscription end date based on billing cycle
   */
  private calculateEndDate(startDate: Date, billingCycle: BillingCycle): Date {
    const endDate = new Date(startDate);

    switch (billingCycle) {
      case BillingCycle.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case BillingCycle.QUARTERLY:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case BillingCycle.ANNUAL:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    return endDate;
  }

  /**
   * Calculate price based on billing cycle with discounts
   */
  private calculatePrice(basePrice: number, billingCycle: BillingCycle): number {
    switch (billingCycle) {
      case BillingCycle.MONTHLY:
        return basePrice;
      case BillingCycle.QUARTERLY:
        return Math.round(basePrice * 3 * 0.9 * 100) / 100; // 10% discount
      case BillingCycle.ANNUAL:
        return Math.round(basePrice * 12 * 0.75 * 100) / 100; // 25% discount
      default:
        return basePrice;
    }
  }
}
