import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '@users/entities/user.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'order_number', type: 'varchar', length: 50, unique: true }) orderNumber: string;
  @Column({ name: 'user_id' }) userId: string;
  @ManyToOne(() => User, user => user.id) @JoinColumn({ name: 'user_id' }) user: User;
  @Column({ type: 'enum', enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], default: 'pending' }) status: string;
  @Column({ type: 'decimal', precision: 15, scale: 3 }) subtotal: number;
  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 }) tax: number;
  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 }) shippingCost: number;
  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 }) discount: number;
  @Column({ type: 'decimal', precision: 15, scale: 3 }) total: number;
  @Column({ type: 'varchar', length: 3, default: 'OMR' }) currency: string;
  @Column({ type: 'varchar', length: 50, default: 'pending' }) paymentStatus: string;
  @Column({ type: 'simple-json', nullable: true }) shippingAddress: Record<string, any>;
  @Column({ type: 'simple-json', nullable: true }) billingAddress: Record<string, any>;
  @Column({ type: 'simple-json', nullable: true }) items: any[];
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
