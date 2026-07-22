import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { SubscriptionPlanEntity } from '../../subscriptions/entities/subscription-plan.entity';

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
    @InjectRepository(SubscriptionPlanEntity)
    private readonly planRepository: Repository<SubscriptionPlanEntity>,
  ) {}

  async findAllPlans() {
    const plans = await this.planRepository.find({
      order: { sortOrder: 'ASC', priceMonthly: 'ASC' },
    });
    return { success: true, data: plans };
  }

  async createPlan(data: Partial<SubscriptionPlanEntity>) {
    const plan = this.planRepository.create(data);
    const saved = await this.planRepository.save(plan);
    this.logger.log(`Created subscription plan: ${saved.id}`);
    return { success: true, data: saved };
  }

  async updatePlan(id: string, data: Partial<SubscriptionPlanEntity>) {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan ${id} not found`);
    Object.assign(plan, data);
    const saved = await this.planRepository.save(plan);
    return { success: true, data: saved };
  }

  async deletePlan(id: string) {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan ${id} not found`);
    plan.isActive = false;
    await this.planRepository.save(plan);
    return { success: true, message: 'Plan deactivated' };
  }

  async findSubscribers(query: SubscriberQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await this.subscriptionRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStats() {
    const plans = await this.planRepository.count({ where: { isActive: true } });
    const activeSubs = await this.subscriptionRepository.count({
      where: { status: 'active' as any },
    });
    return {
      success: true,
      data: { activePlans: plans, activeSubscriptions: activeSubs },
    };
  }
}
