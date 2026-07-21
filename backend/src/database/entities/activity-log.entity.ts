import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { User } from './user.entity';

export enum EntityType {
  ORDER = 'order',
  PRODUCT = 'product',
  USER = 'user',
  STORE = 'store',
  PAYMENT = 'payment',
  SHIPMENT = 'shipment',
  CATEGORY = 'category',
  REVIEW = 'review',
  SETTINGS = 'settings',
  SUBSCRIPTION = 'subscription',
}

export enum ActionType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  VIEWED = 'viewed',
  EXPORTED = 'exported',
  IMPORTED = 'imported',
  LOGIN = 'login',
  LOGOUT = 'logout',
  STATUS_CHANGED = 'status_changed',
  PASSWORD_CHANGED = 'password_changed',
  EMAIL_VERIFIED = 'email_verified',
  PHONE_VERIFIED = 'phone_verified',
}

@Entity('activity_logs')
@Index(['userId'])
@Index(['entityType'])
@Index(['entityId'])
@Index(['action'])
@Index(['createdAt'])
@Index(['entityType', 'entityId'])
@Index(['userId', 'createdAt'])
@Index(['entityType', 'action'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string | null;

  @Column({ type: 'varchar', length: 50, name: 'entity_type' })
  entityType: string;

  @Column({ type: 'uuid', nullable: true, name: 'entity_id' })
  entityId: string | null;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true, name: 'old_values' })
  oldValues: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'new_values' })
  newValues: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent: string | null;

  // Relations
  @ManyToOne(() => User, (user) => user.activityLogs, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User> | null;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Helper methods
  getChangedFields(): string[] {
    if (!this.oldValues || !this.newValues) return [];
    const changes: string[] = [];
    const allKeys = new Set([...Object.keys(this.oldValues), ...Object.keys(this.newValues)]);
    for (const key of allKeys) {
      if (JSON.stringify(this.oldValues[key]) !== JSON.stringify(this.newValues[key])) {
        changes.push(key);
      }
    }
    return changes;
  }

  hasChanges(): boolean {
    return this.getChangedFields().length > 0;
  }

  static createLog(params: {
    userId?: string;
    entityType: string;
    entityId?: string;
    action: string;
    description: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): ActivityLog {
    const log = new ActivityLog();
    log.userId = params.userId ?? null;
    log.entityType = params.entityType;
    log.entityId = params.entityId ?? null;
    log.action = params.action;
    log.description = params.description;
    log.oldValues = params.oldValues ?? null;
    log.newValues = params.newValues ?? null;
    log.ipAddress = params.ipAddress ?? null;
    log.userAgent = params.userAgent ?? null;
    return log;
  }
}
