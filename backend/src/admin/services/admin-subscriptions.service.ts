import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Subscription, SubscriptionPlan } from '../../subscriptions/entities/subscription.entity';

export interface SubscriberQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  planId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class AdminSubscriptionsService {
  private readonly logger = new Logger(AdminSubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
  ) {}

  async findAllPlans() {
    const plans = await this.planRepository.find({
      order: { price: 'ASC' },
      relations: ['subscriptions'],
    });

    return {
      success: true,
      data: plans,
    };
  }

  async createPlan(data: Partial<SubscriptionPlan>) {
    const plan = this.planRepository.create(data);
    await this.planRepository.save(plan);

    this.logger.log(`Subscription plan created: ${plan.name}`);

    return {
      success: true,
      message: 'Subscription plan created successfully',
      data: plan,
    };
  }

  async updatePlan(id: string, data: Partial<SubscriptionPlan>) {
    const plan = await this.planRepository.findOne({ where: { id } });

    if (!plan) {
      throw new NotFoundException({
        success: false,
        message: `Subscription plan with ID ${id} not found`,
      });
    }

    await this.planRepository.update(id, data);

    const updatedPlan = await this.planRepository.findOne({
      where: { id },
      relations: ['subscriptions'],
    });

    return {
      success: true,
      message: 'Subscription plan updated successfully',
      data: updatedPlan,
    };
  }

  async getSubscribers(query: SubscriberQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.planId) {
      where.planId = query.planId;
    }

    const [subscriptions, total] = await this.subscriptionRepository.findAndCount({
      where,
      order: { [query.sortBy || 'createdAt']: query.sortOrder || 'DESC' },
      skip,
      take: limit,
      relations: ['user', 'plan'],
    });

    return {
      success: true,
      data: subscriptions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats() {
    const [
      totalPlans,
      activePlans,
      totalSubscriptions,
      activeSubscriptions,
      cancelledSubscriptions,
      expiredSubscriptions,
    ] = await Promise.all([
      this.planRepository.count(),
      this.planRepository.count({ where: { isActive: true } }),
      this.subscriptionRepository.count(),
      this.subscriptionRepository.count({ where: { status: 'active' } }),
      this.subscriptionRepository.count({ where: { status: 'cancelled' } }),
      this.subscriptionRepository.count({ where: { status: 'expired' } }),
    ]);

    // Revenue from subscriptions
    const revenueData = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .leftJoin('sub.plan', 'plan')
      .select('SUM(plan.price)', 'total')
      .where('sub.status = :status', { status: 'active' })
      .getRawOne();

    return {
      success: true,
      data: {
        totalPlans,
        activePlans,
        totalSubscriptions,
        activeSubscriptions,
        cancelledSubscriptions,
        expiredSubscriptions,
        monthlyRevenue: Number(revenueData?.total || 0),
      },
    };
  }
}
