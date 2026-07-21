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
import { User } from '../../database/entities/user.entity';

export enum SenderType {
  USER = 'user',
  STORE = 'store',
  ADMIN = 'admin',
  AI = 'ai',
  SYSTEM = 'system',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  LOCATION = 'location',
  PRODUCT = 'product',
  ORDER = 'order',
}

@Entity('chat_messages')
@Index(['conversationId'])
@Index(['senderId'])
@Index(['receiverId'])
@Index(['type'])
@Index(['isRead'])
@Index(['createdAt'])
@Index(['conversationId', 'createdAt'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, name: 'conversation_id' })
  @Index()
  conversationId: string;

  @Column({ type: 'uuid', nullable: true, name: 'sender_id' })
  senderId: string | null;

  @Column({
    type: 'enum',
    enum: SenderType,
    name: 'sender_type',
  })
  senderType: SenderType;

  @Column({ type: 'uuid', nullable: true, name: 'receiver_id' })
  receiverId: string | null;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments: {
    name?: string;
    url: string;
    mimeType?: string;
    size?: number;
  }[] | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'read_at' })
  readAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.sentMessages, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sender_id' })
  sender: Relation<User> | null;

  @ManyToOne(() => User, (user) => user.sentMessages, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'receiver_id' })
  receiver: Relation<User> | null;

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

  hasAttachments(): boolean {
    return this.attachments !== null && this.attachments.length > 0;
  }

  isSystemMessage(): boolean {
    return this.senderType === SenderType.SYSTEM;
  }
}
