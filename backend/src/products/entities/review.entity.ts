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
import { Product } from './product.entity';
import { User } from '../../database/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('reviews')
@Index(['productId'])
@Index(['userId'])
@Index(['orderId'])
@Index(['status'])
@Index(['rating'])
@Index(['productId', 'status'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', nullable: true, name: 'order_id' })
  orderId: string | null;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'text', array: true, nullable: true })
  images: string[] | null;

  @Column({ type: 'boolean', default: false, name: 'is_verified_purchase' })
  isVerifiedPurchase: boolean;

  @Column({ type: 'int', default: 0, name: 'helpful_count' })
  helpfulCount: number;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({ type: 'text', nullable: true })
  reply: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'reply_at' })
  replyAt: Date | null;

  // Relations
  @ManyToOne(() => Product, (product) => product.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @ManyToOne(() => Order, (order) => order.reviews, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order> | null;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Helper method to validate rating
  isValidRating(): boolean {
    return this.rating >= 1 && this.rating <= 5;
  }
}
