import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserBadge } from './user-badge.entity';

export enum BadgeRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, name: 'name_ar' })
  nameAr: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 255, default: '/assets/icons/badge-default.svg' })
  icon: string;

  @Column({ type: 'varchar', length: 50, default: '#6B7280' })
  color: string;

  @Column({
    type: 'enum',
    enum: BadgeRarity,
    default: BadgeRarity.COMMON,
  })
  rarity: BadgeRarity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => UserBadge, (ub) => ub.badge)
  userBadges: UserBadge[];
}
