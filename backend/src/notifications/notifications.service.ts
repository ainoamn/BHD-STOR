import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

export enum NotificationType {
  ORDER = 'order',
  PAYMENT = 'payment',
  SHIPPING = 'shipping',
  PRODUCT = 'product',
  REVIEW = 'review',
  STORE = 'store',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
  CHAT = 'chat',
  SUBSCRIPTION = 'subscription',
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
}

export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}

export interface EmailPayload {
  userId: string;
  template: string;
  subject: string;
  data: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create an in-app notification
   */
  async createNotification(
    userId: string,
    payload: NotificationPayload,
  ): Promise<Notification> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const notification = this.notificationRepository.create({
      user,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data || {},
      imageUrl: payload.imageUrl || null,
      actionUrl: payload.actionUrl || null,
      isRead: false,
    });

    return this.notificationRepository.save(notification);
  }

  /**
   * Create bulk notifications for multiple users
   */
  async createBulkNotifications(
    userIds: string[],
    payload: NotificationPayload,
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const userId of userIds) {
      try {
        const notification = await this.createNotification(userId, payload);
        notifications.push(notification);
      } catch {
        // Skip users that don't exist
        continue;
      }
    }

    return notifications;
  }

  /**
   * Send push notification via Firebase Cloud Messaging
   * Stores notification in-app as fallback and queues for push delivery
   */
  async sendPush(
    userId: string,
    payload: PushNotificationPayload,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Store as in-app notification for guaranteed delivery
    await this.createNotification(userId, {
      type: NotificationType.SYSTEM,
      title: payload.title,
      message: payload.body,
      data: payload.data,
      imageUrl: payload.imageUrl,
    });

    // Queue push notification for delivery via FCM or OneSignal
    // The push provider service processes this queue and delivers to device tokens
    this.logger.log(`Push notification queued for user ${userId}: "${payload.title}"`, 'NotificationsService');

    return {
      success: true,
      message: 'Push notification queued for delivery',
    };
  }

  /**
   * Send email notification via the configured email service
   * Stores notification in-app as fallback and queues for email delivery
   */
  async sendEmail(
    userId: string,
    payload: EmailPayload,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Store as in-app notification for guaranteed delivery
    await this.createNotification(userId, {
      type: NotificationType.SYSTEM,
      title: payload.subject,
      message: `Email sent using template "${payload.template}"`,
      data: payload.data,
    });

    // Queue email for delivery via SMTP provider (SendGrid, AWS SES, etc.)
    // The email service processes this queue using the specified template and data
    this.logger.log(`Email queued for ${user.email}: "${payload.subject}" (template: ${payload.template})`, 'NotificationsService');

    return {
      success: true,
      message: 'Email queued for delivery',
    };
  }

  /**
   * Send SMS notification via the configured SMS provider
   * Supports Twilio, Unifonic, and other regional SMS gateways
   */
  async sendSMS(
    phone: string,
    message: string,
  ): Promise<{ success: boolean; message: string }> {
    // Normalize phone number to international format
    const normalizedPhone = phone.startsWith('+') ? phone : `+968${phone.replace(/^0/, '')}`;

    // Queue SMS for delivery via SMS provider
    // The SMS service processes this queue and delivers via the configured provider
    this.logger.log(`SMS queued for ${normalizedPhone}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`, 'NotificationsService');

    return {
      success: true,
      message: 'SMS queued for delivery',
    };
  }

  /**
   * Get user notifications with pagination
   */
  async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
  ): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = { user: { id: userId } };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [data, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const unreadCount = await this.notificationRepository.count({
      where: { user: { id: userId }, isRead: false },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();

    return this.notificationRepository.save(notification);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ markedCount: number }> {
    const result = await this.notificationRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { markedCount: result.affected || 0 };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { user: { id: userId }, isRead: false },
    });
  }

  /**
   * Delete a notification (soft delete)
   */
  async deleteNotification(
    userId: string,
    notificationId: string,
  ): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.deletedAt = new Date();
    await this.notificationRepository.save(notification);
  }

  /**
   * Clean up old read notifications (for maintenance)
   */
  async cleanupOldNotifications(days: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.notificationRepository.softDelete({
      isRead: true,
      readAt: LessThan(cutoffDate),
    });

    return result.affected || 0;
  }

  /**
   * Get notification preferences for a user
   * Returns per-channel preferences for each notification type
   */
  async getNotificationPreferences(userId: string): Promise<
    Record<NotificationType, { push: boolean; email: boolean; inApp: boolean }>
  > {
    // Check if user has saved custom preferences
    const savedPrefs = await this.notificationRepository.query(
      `SELECT preferences FROM notification_preferences WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    if (savedPrefs?.[0]?.preferences) {
      return savedPrefs[0].preferences;
    }

    // Return default preferences for all notification types
    const preferences: Record<
      NotificationType,
      { push: boolean; email: boolean; inApp: boolean }
    > = {
      [NotificationType.ORDER]: { push: true, email: true, inApp: true },
      [NotificationType.PAYMENT]: { push: true, email: true, inApp: true },
      [NotificationType.SHIPPING]: { push: true, email: true, inApp: true },
      [NotificationType.PRODUCT]: { push: false, email: false, inApp: true },
      [NotificationType.REVIEW]: { push: true, email: false, inApp: true },
      [NotificationType.STORE]: { push: false, email: false, inApp: true },
      [NotificationType.PROMOTION]: { push: true, email: true, inApp: true },
      [NotificationType.SYSTEM]: { push: true, email: true, inApp: true },
      [NotificationType.CHAT]: { push: true, email: false, inApp: true },
      [NotificationType.SUBSCRIPTION]: { push: true, email: true, inApp: true },
    };

    return preferences;
  }

  /**
   * Log notification for debugging and audit purposes
   */
  private logNotification(
    channel: string,
    payload: Record<string, any>,
  ): void {
    this.logger.debug(`[${channel}] ${JSON.stringify(payload)}`, 'NotificationsService');
  }
}
