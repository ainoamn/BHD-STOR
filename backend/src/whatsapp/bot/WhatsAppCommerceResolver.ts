import { Injectable, Logger } from '@nestjs/common';
import { OrdersService } from '../../orders/orders.service';
import { MarketplaceIntegrationService } from '../../logistics/integration/marketplace-integration.service';
import { CommandResponse } from './Commands';

type SessionLike = {
  language: 'en' | 'ar';
  userId?: string;
  phone: string;
};

/**
 * Resolves WhatsApp bot commerce actions (/order, /track) against live APIs.
 */
@Injectable()
export class WhatsAppCommerceResolver {
  private readonly logger = new Logger(WhatsAppCommerceResolver.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly logistics: MarketplaceIntegrationService,
  ) {}

  async enrich(
    response: CommandResponse,
    session: SessionLike,
  ): Promise<CommandResponse> {
    const actions = response.actions || [];
    if (actions.length === 0) {
      return response;
    }

    const ar = session.language === 'ar';

    for (const action of actions) {
      try {
        if (action.type === 'get_order_status') {
          return await this.resolveOrderStatus(action.payload, ar);
        }
        if (action.type === 'get_orders' || action.type === 'orders_recent') {
          return await this.resolveRecentOrders(action.payload, session, ar);
        }
        if (action.type === 'track_shipment') {
          return await this.resolveTracking(action.payload, ar);
        }
      } catch (error) {
        this.logger.warn(
          `Commerce action ${action.type} failed: ${error.message}`,
        );
        return {
          message: ar
            ? `تعذر تنفيذ الطلب الآن. حاول لاحقاً أو راسل الدعم.\n\n${error.message || ''}`
            : `Could not complete that request right now. Please try again or contact support.\n\n${error.message || ''}`,
          messageAr: `تعذر تنفيذ الطلب الآن. حاول لاحقاً أو راسل الدعم.`,
          type: 'text',
        };
      }
    }

    return response;
  }

  private async resolveOrderStatus(
    payload: { orderId?: string; userId?: string },
    ar: boolean,
  ): Promise<CommandResponse> {
    const ref = (payload.orderId || '').trim();
    if (!ref) {
      return {
        message: ar
          ? 'أرسل رقم الطلب، مثال: `/order ORD-2024-001`'
          : 'Please provide an order ID, e.g. `/order ORD-2024-001`',
        type: 'text',
      };
    }

    let order;
    const looksUuid = /^[0-9a-f-]{36}$/i.test(ref);
    try {
      order = looksUuid
        ? await this.ordersService.findOne(ref)
        : await this.ordersService.findByOrderNumber(ref);
    } catch {
      try {
        order = looksUuid
          ? await this.ordersService.findByOrderNumber(ref)
          : await this.ordersService.findOne(ref);
      } catch {
        return {
          message: ar
            ? `لم يتم العثور على الطلب *${ref}*. تحقق من الرقم وحاول مجدداً.`
            : `Order *${ref}* was not found. Please check the number and try again.`,
          type: 'text',
        };
      }
    }

    const total = Number((order as any).total ?? (order as any).totalAmount ?? 0).toFixed(3);
    const tracking = order.trackingNumber
      ? `\n${ar ? 'التتبع' : 'Tracking'}: \`${order.trackingNumber}\`\n${ar ? 'تتبع عبر' : 'Track with'}: \`/track ${order.trackingNumber}\``
      : '';

    const message = ar
      ? `*📦 حالة الطلب*\n\nالرقم: *${order.orderNumber || order.id}*\nالحالة: *${order.status}*\nالدفع: *${order.paymentStatus}*\nالمبلغ: *${total} ${order.currency || 'OMR'}*${tracking}`
      : `*📦 Order Status*\n\nNumber: *${order.orderNumber || order.id}*\nStatus: *${order.status}*\nPayment: *${order.paymentStatus}*\nTotal: *${total} ${order.currency || 'OMR'}*${tracking}`;

    return { message, type: 'text' };
  }

  private async resolveRecentOrders(
    payload: { userId?: string },
    session: SessionLike,
    ar: boolean,
  ): Promise<CommandResponse> {
    if (!payload.userId && !session.userId) {
      return {
        message: ar
          ? 'لعرض طلباتك، أرسل رقم طلب محدد:\n`/order ORD-XXXX`\nأو اربط حسابك لاحقاً.'
          : 'To list orders, send a specific order id:\n`/order ORD-XXXX`\n(or link your account later).',
        type: 'text',
        nextCommand: 'order',
      };
    }

    const userId = payload.userId || session.userId!;
    const result = await this.ordersService.findAll(userId, {
      page: 1,
      limit: 5,
    });

    if (!result.data?.length) {
      return {
        message: ar
          ? 'لا توجد طلبات حديثة على هذا الحساب.'
          : 'No recent orders found for this account.',
        type: 'text',
      };
    }

    const lines = result.data.map((o, i) => {
      const num = o.orderNumber || o.id.slice(0, 8);
      return `${i + 1}. *${num}* — ${o.status} — ${Number(o.total || 0).toFixed(3)} ${o.currency || 'OMR'}`;
    });

    return {
      message: ar
        ? `*📋 آخر الطلبات*\n\n${lines.join('\n')}\n\nللتفاصيل: \`/order رقم_الطلب\``
        : `*📋 Recent Orders*\n\n${lines.join('\n')}\n\nDetails: \`/order ORDER_NUMBER\``,
      type: 'text',
    };
  }

  private async resolveTracking(
    payload: { trackingNumber?: string },
    ar: boolean,
  ): Promise<CommandResponse> {
    const trackingNumber = (payload.trackingNumber || '').trim();
    if (!trackingNumber) {
      return {
        message: ar
          ? 'أرسل رقم التتبع، مثال: `/track TRK123456`'
          : 'Please provide a tracking number, e.g. `/track TRK123456`',
        type: 'text',
        nextCommand: 'track',
      };
    }

    try {
      const info = await this.logistics.getTrackingByNumber(trackingNumber);
      const label = ar
        ? info.statusLabelAr || String(info.status)
        : info.statusLabelEn || String(info.status);
      const eta = info.estimatedDelivery
        ? new Date(info.estimatedDelivery).toLocaleDateString()
        : ar
          ? 'غير محدد'
          : 'TBD';
      const location = info.currentLocation
        ? `${info.currentLocation.lat}, ${info.currentLocation.lng}`
        : '—';

      const timeline = (info.timeline || [])
        .slice(-3)
        .map((e) => {
          const t = new Date(e.timestamp).toLocaleString();
          const l = ar ? e.labelAr || e.status : e.labelEn || e.status;
          return `• ${t}: ${l}`;
        })
        .join('\n');

      const message = ar
        ? `*📍 تتبع الشحنة*\n\nالرقم: *${info.trackingNumber}*\nالحالة: *${label}*\nالتوصيل المتوقع: *${eta}*\nالموقع: ${location}${timeline ? `\n\nآخر التحديثات:\n${timeline}` : ''}`
        : `*📍 Shipment Tracking*\n\nNumber: *${info.trackingNumber}*\nStatus: *${label}*\nETA: *${eta}*\nLocation: ${location}${timeline ? `\n\nLatest updates:\n${timeline}` : ''}`;

      return { message, type: 'text' };
    } catch {
      return {
        message: ar
          ? `لم يتم العثور على شحنة بالرقم *${trackingNumber}*.`
          : `No shipment found for tracking number *${trackingNumber}*.`,
        type: 'text',
      };
    }
  }
}
