import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  CommissionPlan,
  CommissionType,
  ApplicableTo,
  type CommissionTier,
  type MLMLevel,
} from '../entities/commission-plan.entity';
import {
  Commission,
  CommissionStatus,
} from '../entities/commission.entity';

export interface CreatePlanDto {
  name: string;
  type: CommissionType;
  rate?: number;
  amount?: number;
  tiers?: CommissionTier[];
  levels?: MLMLevel[];
  applicableTo?: ApplicableTo;
  productIds?: string[];
  categoryIds?: string[];
  active?: boolean;
}

export interface UpdatePlanDto extends Partial<CreatePlanDto> {}

export interface CalculateCommissionDto {
  userId: string;
  orderId: string;
  productId?: string;
  categoryId?: string;
  saleAmount: number;
}

export interface CommissionReportQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  status?: CommissionStatus;
}

// MLM structure - in production this would come from a referrals/relationships table
interface MLMNode {
  userId: string;
  referrerId: string | null;
  level: number;
  children: MLMNode[];
}

@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(CommissionPlan)
    private readonly planRepo: Repository<CommissionPlan>,
    @InjectRepository(Commission)
    private readonly commissionRepo: Repository<Commission>,
  ) {}

  // ─── Plan Management ───────────────────────────────────────────

  async createPlan(dto: CreatePlanDto): Promise<CommissionPlan> {
    this.validatePlan(dto);
    const plan = this.planRepo.create({
      ...dto,
      applicableTo: dto.applicableTo || ApplicableTo.ALL_PRODUCTS,
      active: dto.active ?? true,
      productIds: dto.productIds || [],
      categoryIds: dto.categoryIds || [],
    });
    return this.planRepo.save(plan);
  }

  async findAllPlans(): Promise<CommissionPlan[]> {
    return this.planRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findPlan(id: string): Promise<CommissionPlan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan ${id} not found`);
    return plan;
  }

  async updatePlan(id: string, dto: UpdatePlanDto): Promise<CommissionPlan> {
    const plan = await this.findPlan(id);
    this.validatePlan({ ...plan, ...dto });
    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  async deletePlan(id: string): Promise<void> {
    const result = await this.planRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Plan ${id} not found`);
    }
  }

  // ─── Commission Calculation ────────────────────────────────────

  async calculateCommission(
    dto: CalculateCommissionDto,
  ): Promise<Commission[]> {
    const plans = await this.findApplicablePlans(dto);
    const commissions: Commission[] = [];

    for (const plan of plans) {
      const commissionAmount = this.computeAmount(plan, dto.saleAmount);

      if (commissionAmount > 0) {
        const commission = this.commissionRepo.create({
          planId: plan.id,
          userId: dto.userId,
          orderId: dto.orderId,
          productId: dto.productId || null,
          saleAmount: dto.saleAmount,
          commissionAmount,
          status: CommissionStatus.PENDING,
        });
        commissions.push(await this.commissionRepo.save(commission));
      }
    }

    return commissions;
  }

  async approveCommission(commissionId: string): Promise<Commission> {
    const commission = await this.findCommission(commissionId);
    if (commission.status !== CommissionStatus.PENDING) {
      throw new BadRequestException(
        `Commission is already ${commission.status}`,
      );
    }
    commission.status = CommissionStatus.APPROVED;
    return this.commissionRepo.save(commission);
  }

  async payCommission(
    commissionId: string,
    paidBy?: string,
    paymentReference?: string,
  ): Promise<Commission> {
    const commission = await this.findCommission(commissionId);
    if (commission.status !== CommissionStatus.APPROVED) {
      throw new BadRequestException(
        'Commission must be approved before payment',
      );
    }
    commission.status = CommissionStatus.PAID;
    commission.paidAt = new Date();
    commission.paidBy = paidBy || null;
    commission.paymentReference = paymentReference || null;
    return this.commissionRepo.save(commission);
  }

  async getUserCommissions(
    userId: string,
    status?: CommissionStatus,
  ): Promise<Commission[]> {
    const where: any = { userId };
    if (status) where.status = status;
    return this.commissionRepo.find({
      where,
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCommissionReport(query: CommissionReportQuery): Promise<{
    commissions: Commission[];
    summary: {
      totalCommission: number;
      totalSales: number;
      pendingAmount: number;
      approvedAmount: number;
      paidAmount: number;
      cancelledAmount: number;
      countByStatus: Record<string, number>;
    };
  }> {
    const where: any = {};

    if (query.startDate && query.endDate) {
      where.createdAt = Between(query.startDate, query.endDate);
    }
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;

    const commissions = await this.commissionRepo.find({
      where,
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    const summary = {
      totalCommission: 0,
      totalSales: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      paidAmount: 0,
      cancelledAmount: 0,
      countByStatus: {} as Record<string, number>,
    };

    for (const c of commissions) {
      summary.totalCommission += Number(c.commissionAmount);
      summary.totalSales += Number(c.saleAmount);

      switch (c.status) {
        case CommissionStatus.PENDING:
          summary.pendingAmount += Number(c.commissionAmount);
          break;
        case CommissionStatus.APPROVED:
          summary.approvedAmount += Number(c.commissionAmount);
          break;
        case CommissionStatus.PAID:
          summary.paidAmount += Number(c.commissionAmount);
          break;
        case CommissionStatus.CANCELLED:
          summary.cancelledAmount += Number(c.commissionAmount);
          break;
      }

      summary.countByStatus[c.status] =
        (summary.countByStatus[c.status] || 0) + 1;
    }

    return { commissions, summary };
  }

  // ─── MLM ───────────────────────────────────────────────────────

  async getMLMDownline(userId: string): Promise<{
    node: MLMNode;
    totalEarnings: number;
    networkSize: number;
  }> {
    // In production, this queries a referrals table
    // For now, we build a mock structure based on commissions
    const commissions = await this.commissionRepo.find({
      where: { userId },
      relations: ['plan'],
    });

    const mlmCommissions = commissions.filter(
      (c) => c.plan?.type === CommissionType.MLM,
    );

    // Build tree structure from MLM commissions
    const rootNode: MLMNode = {
      userId,
      referrerId: null,
      level: 0,
      children: [],
    };

    // Add children up to 5 levels deep (mock data)
    for (let i = 1; i <= 3; i++) {
      const child: MLMNode = {
        userId: `downline-${i}-${userId.slice(0, 4)}`,
        referrerId: userId,
        level: i,
        children: [],
      };

      for (let j = 1; j <= 2; j++) {
        const grandchild: MLMNode = {
          userId: `downline-${i}-${j}-${userId.slice(0, 4)}`,
          referrerId: child.userId,
          level: i + 1,
          children: [],
        };
        child.children.push(grandchild);
      }

      rootNode.children.push(child);
    }

    const totalEarnings = mlmCommissions.reduce(
      (sum, c) => sum + Number(c.commissionAmount),
      0,
    );
    const networkSize = this.countNodes(rootNode) - 1; // exclude root

    return { node: rootNode, totalEarnings, networkSize };
  }

  async calculateMLMCommission(
    saleAmount: number,
    referrerId: string,
    orderId: string,
  ): Promise<Commission[]> {
    // Find the MLM plan
    const plans = await this.planRepo.find({
      where: { type: CommissionType.MLM, active: true },
    });

    if (plans.length === 0) return [];

    const commissions: Commission[] = [];

    // Get upline chain
    const upline = await this.getUplineChain(referrerId);

    for (const plan of plans) {
      if (!plan.levels) continue;

      for (const member of upline) {
        const levelConfig = plan.levels.find((l) => l.level === member.level);
        if (!levelConfig) continue;

        const commissionAmount = saleAmount * levelConfig.rate;

        if (commissionAmount > 0) {
          const commission = this.commissionRepo.create({
            planId: plan.id,
            userId: member.userId,
            orderId,
            saleAmount,
            commissionAmount,
            status: CommissionStatus.PENDING,
            notes: `MLM Level ${member.level} commission (${(levelConfig.rate * 100).toFixed(2)}%)`,
          });
          commissions.push(await this.commissionRepo.save(commission));
        }
      }
    }

    return commissions;
  }

  // ─── Helpers ───────────────────────────────────────────────────

  private validatePlan(dto: Partial<CreatePlanDto>): void {
    if (dto.type === CommissionType.PERCENTAGE && dto.rate === undefined) {
      throw new BadRequestException('Rate is required for percentage plans');
    }
    if (dto.type === CommissionType.FIXED && dto.amount === undefined) {
      throw new BadRequestException('Amount is required for fixed plans');
    }
    if (dto.type === CommissionType.TIERED && (!dto.tiers || dto.tiers.length === 0)) {
      throw new BadRequestException('Tiers are required for tiered plans');
    }
    if (dto.type === CommissionType.MLM && (!dto.levels || dto.levels.length === 0)) {
      throw new BadRequestException('Levels are required for MLM plans');
    }
  }

  private async findApplicablePlans(
    dto: CalculateCommissionDto,
  ): Promise<CommissionPlan[]> {
    const plans = await this.planRepo.find({ where: { active: true } });

    return plans.filter((plan) => {
      switch (plan.applicableTo) {
        case ApplicableTo.ALL_PRODUCTS:
          return true;
        case ApplicableTo.SPECIFIC_PRODUCTS:
          return (
            dto.productId && plan.productIds.includes(dto.productId)
          );
        case ApplicableTo.CATEGORIES:
          return (
            dto.categoryId && plan.categoryIds.includes(dto.categoryId)
          );
        default:
          return false;
      }
    });
  }

  private computeAmount(plan: CommissionPlan, saleAmount: number): number {
    switch (plan.type) {
      case CommissionType.PERCENTAGE:
        return saleAmount * (plan.rate || 0);

      case CommissionType.FIXED:
        return plan.amount || 0;

      case CommissionType.TIERED: {
        if (!plan.tiers) return 0;
        const tier = plan.tiers.find(
          (t) =>
            saleAmount >= t.minAmount &&
            (!t.maxAmount || saleAmount < t.maxAmount),
        );
        return tier ? saleAmount * tier.rate : 0;
      }

      case CommissionType.MLM:
        // MLM commissions are calculated separately
        return 0;

      default:
        return 0;
    }
  }

  private async findCommission(id: string): Promise<Commission> {
    const commission = await this.commissionRepo.findOne({
      where: { id },
      relations: ['plan'],
    });
    if (!commission) {
      throw new NotFoundException(`Commission ${id} not found`);
    }
    return commission;
  }

  private async getUplineChain(
    referrerId: string,
  ): Promise<{ userId: string; level: number }[]> {
    // In production, this queries a user_referrals table
    // Returns the chain of uplines with their levels
    const chain: { userId: string; level: number }[] = [];

    // Mock: Generate a chain of 3 levels
    for (let i = 1; i <= 3; i++) {
      chain.push({
        userId: i === 1 ? referrerId : `upline-${i}-${referrerId.slice(0, 6)}`,
        level: i,
      });
    }

    return chain;
  }

  private countNodes(node: MLMNode): number {
    let count = 1;
    for (const child of node.children) {
      count += this.countNodes(child);
    }
    return count;
  }
}
