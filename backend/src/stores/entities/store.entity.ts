import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '@users/entities/user.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 255 }) name: string;
  @Column({ type: 'varchar', length: 500, nullable: true }) description: string;
  @Column({ type: 'varchar', length: 255, unique: true }) slug: string;
  @Column({ name: 'owner_id' }) ownerId: string;
  @ManyToOne(() => User, user => user.id) @JoinColumn({ name: 'owner_id' }) owner: User;
  @Column({ type: 'varchar', length: 255, nullable: true }) logo: string;
  @Column({ type: 'varchar', length: 50, default: 'pending' }) status: string;
  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @Column({ type: 'varchar', length: 255, nullable: true }) address: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) city: string;
  @Column({ type: 'varchar', length: 20, nullable: true }) phone: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) email: string;
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 }) rating: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
