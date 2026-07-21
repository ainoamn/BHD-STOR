import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
@Index(['userId'])
@Index(['sessionId'])
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'session_id' })
  sessionId: string | null;

  @Column({ type: 'varchar', length: 3, default: 'OMR' })
  currency: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0, name: 'discount_amount' })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0, name: 'tax_amount' })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  total: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'coupon_code' })
  couponCode: string | null;

  @Column({ type: 'int', default: 0, name: 'item_count' })
  itemCount: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'expires_at' })
  expiresAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.cartItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User> | null;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true, orphanRemoval: true })
  items: Relation<CartItem[]>;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  isExpired(): boolean {
    return this.expiresAt !== null && new Date() > this.expiresAt;
  }

  isEmpty(): boolean {
    return !this.items || this.items.length === 0;
  }

  recalculateTotals(): void {
    if (!this.items) return;
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    this.itemCount = this.items.reduce((count, item) => count + item.quantity, 0);
    this.total = Math.max(0, this.subtotal - this.discountAmount + this.taxAmount);
  }
}
