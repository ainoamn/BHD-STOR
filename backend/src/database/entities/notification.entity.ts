import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  ORDER = 'order',
  PAYMENT = 'payment',
  SHIPPING = 'shipping',
  PRODUCT = 'product',
  REVIEW = 'review',
  SYSTEM = 'system',
  PROMOTION = 'promotion',
}

@Entity('notifications')
@Index(['userId'])
@Index(['type'])
@Index(['isRead'])
@Index(['createdAt'])
@Index(['userId', 'isRead'])
@Index(['userId', 'type'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'read_at' })
  readAt: Date | null;

  @Column({ type: 'varchar', length: 20, array: true, default: [], name: 'sent_via' })
  sentVia: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'action_url' })
  actionUrl: string | null;

  // Relations
  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  markAsRead(): void {
    if (!this.isRead) {
      this.isRead = true;
      this.readAt = new Date();
    }
  }

  markAsUnread(): void {
    this.isRead = false;
    this.readAt = null;
  }

  wasSentVia(channel: string): boolean {
    return this.sentVia.includes(channel);
  }
}
