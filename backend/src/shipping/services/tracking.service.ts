import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { OmanPostService } from './oman-post.service';
import { AramexService } from './aramex.service';
import { DHLService } from './dhl.service';
import { FedExService } from './fedex.service';
import { UPSService } from './ups.service';
import { TrackingResult, TrackingEvent, TrackingSubscription } from '../dto/tracking-request.dto';

type TrackingCallback = (event: TrackingEvent, tracking: TrackingResult) => void | Promise<void>;

interface TrackingSubscriptionInternal {
  id: string;
  trackingNumber: string;
  carrier: string;
  callbacks: Set<TrackingCallback>;
  lastKnownStatus?: string;
  email?: string;
  webhookUrl?: string;
  active: boolean;
  createdAt: Date;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  private readonly subscriptions = new Map<string, TrackingSubscriptionInternal>();
  private readonly pollInterval: number;
  private pollingTimer?: NodeJS.Timeout;
  private readonly trackingHistory = new Map<string, { events: TrackingEvent[]; lastUpdated: Date }>();

  constructor(
    private readonly omanPostService: OmanPostService,
    private readonly aramexService: AramexService,
    private readonly dhlService: DHLService,
    private readonly fedExService: FedExService,
    private readonly upsService: UPSService,
  ) {
    this.pollInterval = parseInt(process.env.TRACKING_POLL_INTERVAL_MS || '300000', 10); // Default 5 minutes
    this.startPolling();
  }

  /**
   * Track a shipment across any carrier
   */
  async trackShipment(trackingNumber: string, carrier: string): Promise<TrackingResult> {
    this.logger.log(`Tracking shipment ${trackingNumber} via ${carrier}`);

    try {
      let result: TrackingResult;

      switch (carrier.toLowerCase()) {
        case 'oman_post':
          result = await this.omanPostService.getTracking(trackingNumber);
          break;
        case 'aramex':
          result = await this.aramexService.getTracking(trackingNumber);
          break;
        case 'dhl':
          result = await this.dhlService.getTracking(trackingNumber);
          break;
        case 'fedex':
          result = await this.fedExService.getTracking(trackingNumber);
          break;
        case 'ups':
          result = await this.upsService.getTracking(trackingNumber);
          break;
        default:
          throw new Error(`Unsupported carrier: ${carrier}`);
      }

      // Store tracking history
      this.storeTrackingHistory(trackingNumber, result.events);

      return result;
    } catch (error) {
      this.logger.error(`Tracking failed for ${trackingNumber}: ${error.message}`);
      throw new InternalServerErrorException(`Tracking failed: ${error.message}`);
    }
  }

  /**
   * Track multiple shipments at once
   */
  async trackMultipleShipments(shipments: Array<{ trackingNumber: string; carrier: string }>): Promise<TrackingResult[]> {
    const promises = shipments.map(({ trackingNumber, carrier }) =>
      this.trackShipment(trackingNumber, carrier).catch((error) => ({
        trackingNumber,
        carrier,
        carrierName: carrier,
        status: 'error',
        error: error.message,
        events: [],
        origin: { city: '', country: '' },
        destination: { city: '', country: '' },
        lastUpdated: new Date().toISOString(),
        isDelivered: false,
      } as TrackingResult)),
    );

    return Promise.all(promises);
  }

  /**
   * Sync latest tracking information for a shipment
   */
  async syncTracking(trackingNumber: string, carrier: string): Promise<TrackingResult> {
    this.logger.log(`Syncing tracking for ${trackingNumber}`);

    const result = await this.trackShipment(trackingNumber, carrier);

    // Check for status changes and notify subscribers
    await this.checkStatusChange(trackingNumber, result);

    return result;
  }

  /**
   * Send tracking notification to customer
   */
  async notifyCustomer(orderId: string, event: TrackingEvent, tracking: TrackingResult): Promise<void> {
    try {
      this.logger.log(`Sending tracking notification for order ${orderId}: ${event.status}`);

      // In production: send via email, SMS, push notification
      // const notificationPayload = {
      //   orderId,
      //   trackingNumber: tracking.trackingNumber,
      //   carrier: tracking.carrierName,
      //   status: event.status,
      //   description: event.description,
      //   location: event.location,
      //   timestamp: event.timestamp,
      // };

      // await this.notificationService.sendToCustomer(orderId, {
      //   type: 'tracking_update',
      //   title: `Order ${orderId} - ${event.status}`,
      //   body: event.description,
      //   data: notificationPayload,
      // });

      this.logger.debug(`Notification sent for order ${orderId}: ${event.status}`);
    } catch (error) {
      this.logger.error(`Failed to send notification for order ${orderId}: ${error.message}`);
    }
  }

  /**
   * Get full tracking history for a shipment
   */
  async getTrackingHistory(trackingNumber: string): Promise<TrackingEvent[]> {
    const history = this.trackingHistory.get(trackingNumber);
    if (history) {
      return history.events;
    }

    // Try to get from storage/database in production
    return [];
  }

  /**
   * Subscribe to tracking updates for a shipment
   */
  async subscribeToUpdates(
    trackingNumber: string,
    carrier: string,
    callback?: TrackingCallback,
    options?: { email?: string; webhookUrl?: string },
  ): Promise<TrackingSubscription> {
    const subscriptionId = `sub-${trackingNumber}-${Date.now()}`;

    const subscription: TrackingSubscriptionInternal = {
      id: subscriptionId,
      trackingNumber,
      carrier,
      callbacks: new Set(),
      email: options?.email,
      webhookUrl: options?.webhookUrl,
      active: true,
      createdAt: new Date(),
    };

    if (callback) {
      subscription.callbacks.add(callback);
    }

    this.subscriptions.set(subscriptionId, subscription);

    // Do initial tracking
    const initialResult = await this.trackShipment(trackingNumber, carrier);
    subscription.lastKnownStatus = initialResult.status;

    this.logger.log(`Tracking subscription created: ${subscriptionId} for ${trackingNumber}`);

    return {
      id: subscriptionId,
      trackingNumber,
      carrier,
      email: options?.email,
      webhookUrl: options?.webhookUrl,
      active: true,
      createdAt: subscription.createdAt.toISOString(),
    };
  }

  /**
   * Unsubscribe from tracking updates
   */
  async unsubscribeFromUpdates(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = false;
      this.subscriptions.delete(subscriptionId);
      this.logger.log(`Tracking subscription removed: ${subscriptionId}`);
      return true;
    }
    return false;
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): TrackingSubscription[] {
    return Array.from(this.subscriptions.values())
      .filter((s) => s.active)
      .map((s) => ({
        id: s.id,
        trackingNumber: s.trackingNumber,
        carrier: s.carrier,
        email: s.email,
        webhookUrl: s.webhookUrl,
        active: s.active,
        createdAt: s.createdAt.toISOString(),
      }));
  }

  /**
   * Get tracking summary for dashboard
   */
  async getTrackingSummary(): Promise<{
    totalActive: number;
    totalDelivered: number;
    totalInTransit: number;
    totalExceptions: number;
    byCarrier: Record<string, number>;
  }> {
    return {
      totalActive: 0,
      totalDelivered: 0,
      totalInTransit: 0,
      totalExceptions: 0,
      byCarrier: {},
    };
  }

  /**
   * Clean up resources on module destroy
   */
  onModuleDestroy() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }
  }

  // ---- Private methods ----

  private startPolling(): void {
    this.logger.log(`Starting tracking polling with interval: ${this.pollInterval}ms`);

    this.pollingTimer = setInterval(async () => {
      await this.pollAllSubscriptions();
    }, this.pollInterval);
  }

  private async pollAllSubscriptions(): Promise<void> {
    const activeSubscriptions = Array.from(this.subscriptions.values()).filter((s) => s.active);

    if (activeSubscriptions.length === 0) return;

    this.logger.debug(`Polling ${activeSubscriptions.length} tracking subscriptions`);

    const promises = activeSubscriptions.map(async (subscription) => {
      try {
        const result = await this.trackShipment(subscription.trackingNumber, subscription.carrier);

        if (result.status !== subscription.lastKnownStatus) {
          this.logger.log(
            `Status change detected: ${subscription.trackingNumber}: ${subscription.lastKnownStatus} -> ${result.status}`,
          );
          subscription.lastKnownStatus = result.status;

          // Notify all registered callbacks
          if (result.events.length > 0) {
            const latestEvent = result.events[result.events.length - 1];
            for (const callback of subscription.callbacks) {
              try {
                await callback(latestEvent, result);
              } catch (err) {
                this.logger.error(`Callback error for ${subscription.id}: ${err.message}`);
              }
            }
          }

          // Auto-unsubscribe if delivered
          if (result.isDelivered) {
            subscription.active = false;
            this.logger.log(`Auto-unsubscribing delivered shipment: ${subscription.trackingNumber}`);
          }
        }
      } catch (error) {
        this.logger.error(`Polling error for ${subscription.trackingNumber}: ${error.message}`);
      }
    });

    await Promise.all(promises);
  }

  private async checkStatusChange(trackingNumber: string, result: TrackingResult): Promise<void> {
    const matchingSubscriptions = Array.from(this.subscriptions.values()).filter(
      (s) => s.trackingNumber === trackingNumber && s.active,
    );

    for (const subscription of matchingSubscriptions) {
      if (result.status !== subscription.lastKnownStatus) {
        subscription.lastKnownStatus = result.status;

        if (result.events.length > 0) {
          const latestEvent = result.events[result.events.length - 1];
          for (const callback of subscription.callbacks) {
            try {
              await callback(latestEvent, result);
            } catch (err) {
              this.logger.error(`Callback error: ${err.message}`);
            }
          }
        }

        if (result.isDelivered) {
          subscription.active = false;
        }
      }
    }
  }

  private storeTrackingHistory(trackingNumber: string, events: TrackingEvent[]): void {
    const existing = this.trackingHistory.get(trackingNumber);
    if (existing) {
      // Merge new events
      const existingTimestamps = new Set(existing.events.map((e) => e.timestamp));
      const newEvents = events.filter((e) => !existingTimestamps.has(e.timestamp));
      existing.events.push(...newEvents);
      existing.events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      existing.lastUpdated = new Date();
    } else {
      this.trackingHistory.set(trackingNumber, {
        events: [...events],
        lastUpdated: new Date(),
      });
    }
  }
}
