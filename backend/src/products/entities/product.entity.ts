import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from '@stores/entities/store.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 255 }) name: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'varchar', length: 255, unique: true }) slug: string;
  @Column({ type: 'decimal', precision: 15, scale: 3 }) price: number;
  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 }) salePrice: number;
  @Column({ type: 'int', default: 0 }) stock: number;
  @Column({ type: 'varchar', length: 50, default: 'active' }) status: string;
  @Column({ name: 'store_id' }) storeId: string;
  @ManyToOne(() => Store, store => store.id) @JoinColumn({ name: 'store_id' }) store: Store;
  @Column({ type: 'simple-json', nullable: true }) images: string[];
  @Column({ type: 'simple-json', nullable: true }) attributes: Record<string, any>;
  @Column({ type: 'varchar', length: 255, nullable: true }) category: string;
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 }) rating: number;
  @Column({ type: 'int', default: 0 }) reviewCount: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
