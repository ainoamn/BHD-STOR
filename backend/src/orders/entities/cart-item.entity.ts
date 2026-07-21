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
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../database/entities/user.entity';

@Entity('cart_items')
@Index(['cartId'])
@Index(['productId'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'cart_id' })
  cartId: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  total: number;

  @Column({ type: 'jsonb', nullable: true, name: 'variant_attributes' })
  variantAttributes: Record<string, string> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'added_at' })
  addedAt: Date;

  // Relations
  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Relation<Cart>;

  @ManyToOne(() => Product, (product) => product.cartItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;

  @ManyToOne(() => User, (user) => user.cartItems, { onDelete: 'CASCADE' })
  user: Relation<User>;

  // Helper methods
  recalculateTotal(): void {
    this.total = this.unitPrice * this.quantity;
  }

  increaseQuantity(amount: number = 1): void {
    this.quantity += amount;
    this.recalculateTotal();
  }

  decreaseQuantity(amount: number = 1): boolean {
    if (this.quantity <= amount) return false;
    this.quantity -= amount;
    this.recalculateTotal();
    return true;
  }
}
