import { ReturnStatus } from '../entities/return-request.entity';

/** Minimal order shape for eligibility (avoids pulling full TypeORM graph in unit tests). */
export interface EligibilityOrderItem {
  productId: string;
  storeId?: string | null;
  quantity?: number;
  unitPrice?: number | string;
  totalPrice?: number | string;
}

export interface EligibilityOrder {
  userId: string;
  storeId?: string | null;
  status: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  statusHistory?: Array<{ status: string; timestamp?: string }> | null;
  items?: EligibilityOrderItem[] | null;
}

export interface EligibilityPolicyLike {
  returnWindow?: number;
  autoApprove?: boolean;
  nonReturnableCategories?: string[];
}

export interface EligibilityInput {
  order: EligibilityOrder | null;
  productId: string;
  userId: string;
  existingOpenReturn: boolean;
  policy: EligibilityPolicyLike | null;
  now?: Date;
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  maxRefundAmount?: number;
  storeId?: string | null;
}

const DELIVERED = 'delivered';

/**
 * Pure eligibility rules (no DB). Used by ReturnsService and unit tests.
 */
export function evaluateReturnEligibility(input: EligibilityInput): EligibilityResult {
  const { order, productId, userId, existingOpenReturn, policy } = input;
  const now = input.now ?? new Date();

  if (!order) {
    return {
      eligible: false,
      reason: 'Order not found or not eligible for return',
    };
  }

  if (order.userId !== userId) {
    return {
      eligible: false,
      reason: 'Order not found or not eligible for return',
    };
  }

  if (String(order.status).toLowerCase() !== DELIVERED) {
    return {
      eligible: false,
      reason: 'Only delivered orders can be returned',
    };
  }

  const items = order.items || [];
  const item = items.find((i) => i.productId === productId);
  if (!item) {
    return {
      eligible: false,
      reason: 'Product not found on this order',
    };
  }

  if (existingOpenReturn) {
    return {
      eligible: false,
      reason: 'A return request already exists for this product on this order',
    };
  }

  const storeId = order.storeId || item.storeId || null;
  const windowDays = policy?.returnWindow ?? 14;

  let deliveredAt = order.updatedAt
    ? new Date(order.updatedAt)
    : order.createdAt
      ? new Date(order.createdAt)
      : now;
  const history = order.statusHistory || [];
  const deliveredEvent = [...history]
    .reverse()
    .find((h) => String(h.status).toLowerCase() === DELIVERED);
  if (deliveredEvent?.timestamp) {
    deliveredAt = new Date(deliveredEvent.timestamp);
  }

  const deadline = new Date(deliveredAt.getTime() + windowDays * 24 * 60 * 60 * 1000);
  if (now > deadline) {
    return {
      eligible: false,
      reason: `Return window expired. Returns must be initiated within ${windowDays} days of delivery.`,
      storeId,
    };
  }

  const maxRefundAmount =
    Number(item.totalPrice) ||
    Number(item.unitPrice) * Number(item.quantity || 1) ||
    0;

  return {
    eligible: true,
    maxRefundAmount,
    storeId,
  };
}

export const OPEN_RETURN_STATUSES: ReturnStatus[] = [
  ReturnStatus.PENDING,
  ReturnStatus.APPROVED,
  ReturnStatus.PICKED_UP,
  ReturnStatus.RECEIVED,
];
