import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReturnRequest,
  ReturnStatus,
  ReturnType,
  TimelineEvent,
} from '../entities/return-request.entity';
import { ReturnPolicy } from '../entities/return-policy.entity';
import { CreateReturnDto } from '../dto/create-return.dto';
import { UpdateReturnDto } from '../dto/update-return.dto';
import { Store } from '../../stores/entities/store.entity';
import { isStaffRole } from '../../auth/utils/roles';
import { assertReturnAccess as assertReturnAccessFn } from '../utils/return-access';

export interface ReturnsQuery {
  status?: ReturnStatus;
  userId?: string;
  storeId?: string;
  orderId?: string;
  page?: number;
  limit?: number;
}

export interface ReturnPolicyData {
  returnWindow?: number;
  exchangeWindow?: number;
  conditions?: string[];
  nonReturnableCategories?: string[];
  restockingFee?: number;
  autoApprove?: boolean;
}

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(ReturnRequest)
    private readonly returnRepo: Repository<ReturnRequest>,
    @InjectRepository(ReturnPolicy)
    private readonly policyRepo: Repository<ReturnPolicy>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
  ) {}

  /** Owner or platform staff may view. */
  assertReturnAccess(
    returnRequest: ReturnRequest,
    userId: string,
    role?: string,
  ): void {
    assertReturnAccessFn(returnRequest, userId, role);
  }

  /** Staff or store owner may update that store's return policy. */
  async assertStorePolicyAccess(
    storeId: string,
    userId: string,
    role?: string,
  ): Promise<void> {
    if (isStaffRole(role)) return;
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (store?.ownerId && store.ownerId === userId) return;
    throw new ForbiddenException(
      'Only the store owner or staff can update return policy',
    );
  }

  async createReturn(userId: string, dto: CreateReturnDto): Promise<ReturnRequest> {
    // Check eligibility
    const eligible = await this.checkEligibility(dto.orderId, dto.productId, userId);
    if (!eligible.eligible) {
      throw new BadRequestException(eligible.reason);
    }

    const timeline: TimelineEvent[] = [
      {
        status: ReturnStatus.PENDING,
        note: 'Return request submitted',
        timestamp: new Date().toISOString(),
        actor: userId,
      },
    ];

    const returnRequest = this.returnRepo.create({
      ...dto,
      userId,
      status: ReturnStatus.PENDING,
      timeline,
    });

    const saved = await this.returnRepo.save(returnRequest);

    // Auto-approve if store policy allows
    if (eligible.policy?.autoApprove) {
      await this.approveReturn(saved.id, eligible.maxRefundAmount);
    }

    return this.findOne(saved.id);
  }

  async findAll(query: ReturnsQuery): Promise<{ items: ReturnRequest[]; total: number }> {
    const { status, userId, storeId, orderId, page = 1, limit = 20 } = query;

    const qb = this.returnRepo.createQueryBuilder('return');

    if (status) {
      qb.andWhere('return.status = :status', { status });
    }

    if (userId) {
      qb.andWhere('return.userId = :userId', { userId });
    }

    if (orderId) {
      qb.andWhere('return.orderId = :orderId', { orderId });
    }

    // storeId filtering would require joining with orders table
    if (storeId) {
      qb.innerJoin('orders', 'o', 'o.id = return.orderId')
        .andWhere('o.storeId = :storeId', { storeId });
    }

    qb.orderBy('return.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepo.findOne({ where: { id } });
    if (!returnRequest) {
      throw new NotFoundException(`Return request with ID "${id}" not found`);
    }
    return returnRequest;
  }

  async updateStatus(
    id: string,
    status: ReturnStatus,
    notes?: string,
    actorId?: string,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id);

    // Validate status transition
    this.validateStatusTransition(returnRequest.status, status);

    const timelineEntry: TimelineEvent = {
      status,
      note: notes || `Status changed to ${status}`,
      timestamp: new Date().toISOString(),
      actor: actorId,
    };

    const updatedTimeline = [...(returnRequest.timeline || []), timelineEntry];

    await this.returnRepo.update(id, {
      status,
      adminNotes: notes || returnRequest.adminNotes,
      timeline: updatedTimeline,
    });

    return this.findOne(id);
  }

  async approveReturn(id: string, refundAmount?: number): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id);

    if (returnRequest.status !== ReturnStatus.PENDING) {
      throw new BadRequestException('Only pending returns can be approved');
    }

    const timelineEntry: TimelineEvent = {
      status: ReturnStatus.APPROVED,
      note: refundAmount
        ? `Return approved with refund amount ${refundAmount}`
        : 'Return approved',
      timestamp: new Date().toISOString(),
    };

    await this.returnRepo.update(id, {
      status: ReturnStatus.APPROVED,
      refundAmount: refundAmount || returnRequest.refundAmount,
      timeline: [...(returnRequest.timeline || []), timelineEntry],
    });

    return this.findOne(id);
  }

  async rejectReturn(id: string, reason: string): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id);

    if (returnRequest.status !== ReturnStatus.PENDING) {
      throw new BadRequestException('Only pending returns can be rejected');
    }

    const timelineEntry: TimelineEvent = {
      status: ReturnStatus.REJECTED,
      note: `Return rejected: ${reason}`,
      timestamp: new Date().toISOString(),
    };

    await this.returnRepo.update(id, {
      status: ReturnStatus.REJECTED,
      adminNotes: reason,
      timeline: [...(returnRequest.timeline || []), timelineEntry],
    });

    return this.findOne(id);
  }

  async schedulePickup(
    id: string,
    date: Date,
    driverId?: string,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id);

    if (returnRequest.status !== ReturnStatus.APPROVED) {
      throw new BadRequestException('Return must be approved before scheduling pickup');
    }

    const timelineEntry: TimelineEvent = {
      status: ReturnStatus.PICKED_UP,
      note: `Pickup scheduled for ${date.toISOString()}`,
      timestamp: new Date().toISOString(),
      actor: driverId,
    };

    await this.returnRepo.update(id, {
      pickupDate: date,
      timeline: [...(returnRequest.timeline || []), timelineEntry],
    });

    return this.findOne(id);
  }

  async processRefund(id: string): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id);

    if (returnRequest.status !== ReturnStatus.RECEIVED) {
      throw new BadRequestException('Return must be received before processing refund');
    }

    if (returnRequest.type !== ReturnType.RETURN) {
      throw new BadRequestException('Cannot process refund for exchange request');
    }

    // TODO: Integrate with payment service to create actual refund
    // await this.paymentService.createRefund({
    //   orderId: returnRequest.orderId,
    //   amount: returnRequest.refundAmount,
    //   method: returnRequest.refundMethod,
    // });

    const timelineEntry: TimelineEvent = {
      status: ReturnStatus.REFUNDED,
      note: `Refund of ${returnRequest.refundAmount} processed via ${returnRequest.refundMethod}`,
      timestamp: new Date().toISOString(),
    };

    await this.returnRepo.update(id, {
      status: ReturnStatus.REFUNDED,
      timeline: [...(returnRequest.timeline || []), timelineEntry],
    });

    return this.findOne(id);
  }

  async processExchange(id: string): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id);

    if (returnRequest.status !== ReturnStatus.RECEIVED) {
      throw new BadRequestException('Return must be received before processing exchange');
    }

    if (returnRequest.type !== ReturnType.EXCHANGE) {
      throw new BadRequestException('Cannot process exchange for return request');
    }

    if (!returnRequest.exchangeProductId) {
      throw new BadRequestException('Exchange product not specified');
    }

    // TODO: Create new order for exchange
    // const exchangeOrder = await this.orderService.createExchangeOrder({
    //   originalOrderId: returnRequest.orderId,
    //   productId: returnRequest.exchangeProductId,
    //   variant: returnRequest.exchangeVariant,
    //   userId: returnRequest.userId,
    // });

    const timelineEntry: TimelineEvent = {
      status: ReturnStatus.EXCHANGED,
      note: `Exchange processed with new product`,
      timestamp: new Date().toISOString(),
    };

    await this.returnRepo.update(id, {
      status: ReturnStatus.EXCHANGED,
      timeline: [...(returnRequest.timeline || []), timelineEntry],
    });

    return this.findOne(id);
  }

  async checkEligibility(
    orderId: string,
    productId: string,
    userId?: string,
  ): Promise<{
    eligible: boolean;
    reason?: string;
    policy?: ReturnPolicy;
    maxRefundAmount?: number;
  }> {
    // TODO: Fetch order and check:
    // 1. Order exists and belongs to user
    // 2. Order is delivered
    // 3. Within return window
    // 4. Product category is returnable
    // 5. Product not already returned

    // For now, return mock eligible response
    // In real implementation, this would fetch the order and verify

    const policy = await this.getReturnPolicy('store-id-from-order');

    // Mock: Check if within return window (e.g., 14 days from delivery)
    const orderDeliveredDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const returnDeadline = new Date(
      orderDeliveredDate.getTime() + (policy?.returnWindow || 14) * 24 * 60 * 60 * 1000,
    );

    if (new Date() > returnDeadline) {
      return {
        eligible: false,
        reason: `Return window expired. Returns must be initiated within ${policy?.returnWindow || 14} days of delivery.`,
        policy,
      };
    }

    return {
      eligible: true,
      policy,
      maxRefundAmount: 100.000, // Would come from order line item
    };
  }

  async getReturnPolicy(storeId: string): Promise<ReturnPolicy | null> {
    const policy = await this.policyRepo.findOne({ where: { storeId } });
    if (policy) return policy;

    // Return default policy if none set
    return this.policyRepo.create({
      storeId,
      returnWindow: 14,
      exchangeWindow: 14,
      conditions: [
        'Item must be in original condition',
        'Original packaging required',
        'Receipt or proof of purchase required',
      ],
      nonReturnableCategories: ['intimates', 'perishables', 'personal-care'],
      restockingFee: 0,
      autoApprove: false,
    });
  }

  async updateReturnPolicy(
    storeId: string,
    data: ReturnPolicyData,
  ): Promise<ReturnPolicy> {
    let policy = await this.policyRepo.findOne({ where: { storeId } });

    if (!policy) {
      policy = this.policyRepo.create({ storeId, ...data });
    } else {
      Object.assign(policy, data);
    }

    return this.policyRepo.save(policy);
  }

  async markAsReceived(id: string): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id);

    const timelineEntry: TimelineEvent = {
      status: ReturnStatus.RECEIVED,
      note: 'Item received at warehouse',
      timestamp: new Date().toISOString(),
    };

    await this.returnRepo.update(id, {
      status: ReturnStatus.RECEIVED,
      timeline: [...(returnRequest.timeline || []), timelineEntry],
    });

    return this.findOne(id);
  }

  async assignDriver(id: string, driverId: string): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id);

    if (returnRequest.status !== ReturnStatus.APPROVED) {
      throw new BadRequestException('Return must be approved before assigning driver');
    }

    const timelineEntry: TimelineEvent = {
      status: ReturnStatus.PICKED_UP,
      note: `Driver ${driverId} assigned for pickup`,
      timestamp: new Date().toISOString(),
      actor: driverId,
    };

    await this.returnRepo.update(id, {
      timeline: [...(returnRequest.timeline || []), timelineEntry],
    });

    return this.findOne(id);
  }

  async updateTracking(id: string, trackingNumber: string): Promise<ReturnRequest> {
    await this.returnRepo.update(id, { trackingNumber });
    return this.findOne(id);
  }

  async update(
    id: string,
    dto: UpdateReturnDto,
    userId: string,
    role?: string,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.findOne(id);
    this.assertReturnAccess(returnRequest, userId, role);

    const staff = isStaffRole(role);
    if (!staff) {
      if (returnRequest.status !== ReturnStatus.PENDING) {
        throw new BadRequestException(
          'Only pending returns can be updated by the customer',
        );
      }
      // Customers cannot set status, refund, admin notes, or assign drivers
      dto = {
        pickupDate: dto.pickupDate,
        trackingNumber: dto.trackingNumber,
      };
    }

    const updates: Partial<ReturnRequest> = {};

    if (dto.status && dto.status !== returnRequest.status) {
      if (!staff) {
        throw new ForbiddenException('Only staff can change return status');
      }
      this.validateStatusTransition(returnRequest.status, dto.status);
      updates.status = dto.status;

      const timelineEntry: TimelineEvent = {
        status: dto.status,
        note: `Status updated to ${dto.status}`,
        timestamp: new Date().toISOString(),
        actor: userId,
      };
      updates.timeline = [...(returnRequest.timeline || []), timelineEntry];
    }

    if (staff && dto.adminNotes) updates.adminNotes = dto.adminNotes;
    if (staff && dto.refundAmount) updates.refundAmount = dto.refundAmount;
    if (dto.pickupDate) updates.pickupDate = new Date(dto.pickupDate);
    if (dto.trackingNumber) updates.trackingNumber = dto.trackingNumber;

    if (Object.keys(updates).length === 0) {
      return returnRequest;
    }

    await this.returnRepo.update(id, updates);
    return this.findOne(id);
  }

  async remove(id: string, userId: string, role?: string): Promise<void> {
    const returnRequest = await this.findOne(id);
    this.assertReturnAccess(returnRequest, userId, role);

    if (!isStaffRole(role) && returnRequest.status !== ReturnStatus.PENDING) {
      throw new BadRequestException(
        'Only pending returns can be cancelled by the customer',
      );
    }

    await this.returnRepo.remove(returnRequest);
  }

  private validateStatusTransition(
    current: ReturnStatus,
    next: ReturnStatus,
  ): void {
    const validTransitions: Record<ReturnStatus, ReturnStatus[]> = {
      [ReturnStatus.PENDING]: [ReturnStatus.APPROVED, ReturnStatus.REJECTED],
      [ReturnStatus.APPROVED]: [ReturnStatus.PICKED_UP, ReturnStatus.CLOSED],
      [ReturnStatus.REJECTED]: [ReturnStatus.CLOSED],
      [ReturnStatus.PICKED_UP]: [ReturnStatus.RECEIVED],
      [ReturnStatus.RECEIVED]: [
        ReturnStatus.REFUNDED,
        ReturnStatus.EXCHANGED,
        ReturnStatus.CLOSED,
      ],
      [ReturnStatus.REFUNDED]: [ReturnStatus.CLOSED],
      [ReturnStatus.EXCHANGED]: [ReturnStatus.CLOSED],
      [ReturnStatus.CLOSED]: [],
    };

    const allowed = validTransitions[current] || [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid status transition from ${current} to ${next}`,
      );
    }
  }
}
