import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  Relation,
} from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('wishlists')
@Unique(['userId', 'productId'])
@Index(['userId'])
@Index(['productId'])
export class Wishlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'added_at' })
  addedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.wishlist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @ManyToOne(() => Product, (product) => product.wishlists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;
}
