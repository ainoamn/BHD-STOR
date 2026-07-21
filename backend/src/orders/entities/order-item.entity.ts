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
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
import { Store } from '../../stores/entities/store.entity';

export enum OrderItemFulfillmentStatus {
  PENDING = 'pending',
  PICKED = 'picked',
  PACKED = 'packed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
}

@Entity('order_items')
@Index(['orderId'])
@Index(['productId'])
@Index(['storeId'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'uuid', name: 'store_id' })
  storeId: string;

  @Column({ type: 'varchar', length: 255, name: 'product_name' })
  productName: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'product_image' })
  productImage: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'variant_attributes' })
  variantAttributes: Record<string, string> | null;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0, name: 'discount_amount' })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0, name: 'tax_amount' })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  total: number;

  @Column({
    type: 'enum',
    enum: OrderItemFulfillmentStatus,
    default: OrderItemFulfillmentStatus.PENDING,
    name: 'fulfillment_status',
  })
  fulfillmentStatus: OrderItemFulfillmentStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  // Relations
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order>;

  @ManyToOne(() => Product, (product) => product.orderItems, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;

  @ManyToOne(() => Store, (store) => store.orders, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'store_id' })
  store: Relation<Store>;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Helper method to calculate subtotal
  getSubtotal(): number {
    return this.unitPrice * this.quantity;
  }
}
