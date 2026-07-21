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
  Tree,
  TreeChildren,
  TreeParent,
  Relation,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('categories')
@Tree('closure-table')
@Index(['slug'])
@Index(['isActive'])
@Index(['level'])
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'parent_id' })
  parentId: string | null;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, name: 'name_en', nullable: true })
  nameEn: string | null;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  @Column({ type: 'int', default: 0, name: 'level' })
  level: number;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  // Tree relations
  @TreeParent({ onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: Relation<Category> | null;

  @TreeChildren({ cascade: true })
  children: Relation<Category[]>;

  // Product relation
  @OneToMany(() => Product, (product) => product.category)
  products: Relation<Product[]>;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
