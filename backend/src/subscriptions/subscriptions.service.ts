import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SubscriptionPlanEntity,
  PlanTier,
} from './entities/subscription-plan.entity';
import { User, CommissionType, SubscriptionPlan as UserPlan } from '../users/entities/user.entity';
import {
  ChooseMonetizationDto,
  MonetizationMode,
} from './dto/choose-monetization.dto';
import {
  assertSelfServicePlanActivation,
  clampCommissionPercent,
} from './utils/plan-access';
import { resolveProductLimit } from './utils/plan-limits';
import { isStaffRole } from '../auth/utils/roles';

const DEFAULT_PLANS: Array<Partial<SubscriptionPlanEntity>> = [
  {
    name: 'Starter',
    nameAr: 'البداية',
    tier: PlanTier.FREE,
    description: 'Start listing with a low fee.',
    descriptionAr: 'ابدأ بعرض منتجاتك برسوم منخفضة.',
    priceMonthly: 0,
    priceYearly: 0,
    productLimit: 10,
    storageLimitMb: 100,
    transactionFeePercent: 5,
    sortOrder: 1,
    isActive: true,
    features: [{ feature: 'products', limit: 10 }],
  },
  {
    name: 'Elite',
    nameAr: 'النخبة',
    tier: PlanTier.BASIC,
    description: 'For small shops growing on BHD.',
    descriptionAr: 'للمتاجر الصغيرة النامية على المنصة.',
    priceMonthly: 9.9,
    priceYearly: 99,
    productLimit: 100,
    storageLimitMb: 1024,
    transactionFeePercent: 3.5,
    sortOrder: 2,
    isActive: true,
    features: [{ feature: 'products', limit: 100 }],
  },
  {
    name: 'Excellence',
    nameAr: 'التميز',
    tier: PlanTier.PREMIUM,
    description: 'Advanced tools and lower fees.',
    descriptionAr: 'أدوات متقدمة ورسوم أقل.',
    priceMonthly: 29.9,
    priceYearly: 299,
    productLimit: 1000,
    storageLimitMb: 10240,
    transactionFeePercent: 2,
    sortOrder: 3,
    isActive: true,
    features: [{ feature: 'products', limit: 1000 }],
  },
  {
    name: 'Leadership',
    nameAr: 'الريادة',
    tier: PlanTier.ENTERPRISE,
    description: 'Full platform access with dedicated support.',
    descriptionAr: 'وصول كامل ودعم مخصص.',
    priceMonthly: 99.9,
    priceYearly: 999,
    productLimit: 0,
    storageLimitMb: 102400,
    transactionFeePercent: 0,
    sortOrder: 4,
    isActive: true,
    features: [{ feature: 'unlimited', limit: 0 }],
  },
];

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(SubscriptionPlanEntity)
    private readonly planRepository: Repository<SubscriptionPlanEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getPlans(): Promise<SubscriptionPlanEntity[]> {
    await this.ensureDefaultPlans();
    return this.planRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getPlanByTier(tier: PlanTier): Promise<SubscriptionPlanEntity> {
    await this.ensureDefaultPlans();
    const plan = await this.planRepository.findOne({
      where: { tier, isActive: true },
    });
    if (!plan) {
      throw new NotFoundException(`Plan tier "${tier}" not found`);
    }
    return plan;
  }

  async ensureDefaultPlans(): Promise<void> {
    const count = await this.planRepository.count();
    if (count > 0) return;

    for (const def of DEFAULT_PLANS) {
      await this.planRepository.save(this.planRepository.create(def));
    }
    this.logger.log('Seeded 4 default seller subscription plans');
  }

  async getMyMonetization(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const plans = await this.getPlans();
    const currentPlan =
      plans.find((p) => p.tier === (user.subscriptionPlan as unknown as PlanTier)) ||
      null;

    return {
      mode: user.commissionType || CommissionType.PERCENTAGE,
      subscriptionPlan: user.subscriptionPlan || UserPlan.FREE,
      commissionRate: Number(user.commissionRate ?? 10),
      currentPlan,
      plans,
    };
  }

  async chooseMonetization(
    userId: string,
    dto: ChooseMonetizationDto,
    role?: string,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.mode === MonetizationMode.PERCENTAGE) {
      const percent = clampCommissionPercent(dto.commissionPercent ?? 10);
      user.commissionType = CommissionType.PERCENTAGE;
      user.commissionRate = percent;
      user.subscriptionPlan = UserPlan.FREE;
      await this.userRepository.save(user);
      return this.getMyMonetization(userId);
    }

    if (!dto.planTier) {
      throw new BadRequestException('planTier is required when mode=subscription');
    }

    const plan = await this.getPlanByTier(dto.planTier);
    // Sellers cannot self-attest paymentConfirmed — staff only
    const paymentConfirmed =
      isStaffRole(role) && dto.paymentConfirmed === true;
    assertSelfServicePlanActivation(plan, role, { paymentConfirmed });

    user.commissionType = CommissionType.SUBSCRIPTION;
    user.subscriptionPlan = plan.tier as unknown as UserPlan;
    // Subscription sellers: per-order fee from plan (often 0–5%), stored as percent
    user.commissionRate = Number(plan.transactionFeePercent ?? 0);
    await this.userRepository.save(user);

    return this.getMyMonetization(userId);
  }

  // Compatibility stubs for older controller routes
  async getPlanByType(planType: string) {
    const tier = planType as PlanTier;
    if (!Object.values(PlanTier).includes(tier)) {
      throw new NotFoundException(`Plan "${planType}" not found`);
    }
    return this.getPlanByTier(tier);
  }

  async subscribe(
    userId: string,
    dto: { plan: string; billingCycle?: string },
    role?: string,
  ) {
    return this.chooseMonetization(
      userId,
      {
        mode: MonetizationMode.SUBSCRIPTION,
        planTier: dto.plan as PlanTier,
      },
      role,
    );
  }

  async getMySubscription(userId: string) {
    return this.getMyMonetization(userId);
  }

  async cancel(userId: string, _reason?: string, role?: string) {
    return this.chooseMonetization(
      userId,
      {
        mode: MonetizationMode.PERCENTAGE,
        commissionPercent: 10,
      },
      role,
    );
  }

  async renew(userId: string) {
    return this.getMyMonetization(userId);
  }

  async upgrade(
    userId: string,
    dto: { newPlan: string },
    role?: string,
  ) {
    return this.chooseMonetization(
      userId,
      {
        mode: MonetizationMode.SUBSCRIPTION,
        planTier: dto.newPlan as PlanTier,
      },
      role,
    );
  }

  async checkFeatureAccess(userId: string, feature: string) {
    const m = await this.getMyMonetization(userId);
    const plan = m.currentPlan;
    const features = (plan?.features || []) as Array<{
      feature?: string;
      limit?: number;
    }>;
    const key = String(feature || '').toLowerCase();
    const hasUnlimited = features.some(
      (f) => String(f.feature || '').toLowerCase() === 'unlimited',
    );
    const matched = features.find(
      (f) => String(f.feature || '').toLowerCase() === key,
    );
    const hasAccess =
      hasUnlimited ||
      !!matched ||
      key === 'products' ||
      key === 'basic';

    return {
      hasAccess,
      feature,
      currentPlan: m.subscriptionPlan,
      productLimit: resolveProductLimit(plan?.productLimit),
      message: hasAccess
        ? 'Access granted for current plan'
        : 'Feature not included in current plan',
    };
  }

  /**
   * Product cap for seller create. null = unlimited. Staff bypass elsewhere.
   */
  async getProductLimitForUser(userId: string): Promise<number | null> {
    const m = await this.getMyMonetization(userId);
    return resolveProductLimit(m.currentPlan?.productLimit);
  }
}
