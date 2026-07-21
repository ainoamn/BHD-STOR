import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserAchievement } from './user-achievement.entity';

export enum AchievementCategory {
  ORDERS = 'orders',
  REVIEWS = 'reviews',
  SOCIAL = 'social',
  EXPLORATION = 'exploration',
  STREAK = 'streak',
  SPECIAL = 'special',
}

export enum AchievementConditionType {
  COUNT = 'count',
  AMOUNT = 'amount',
  STREAK = 'streak',
  FIRST_TIME = 'first_time',
  SOCIAL = 'social',
}

@Entity('achievements')
export class Achievement {
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

  @Column({ type: 'text', name: 'description_ar' })
  descriptionAr: string;

  @Column({
    type: 'enum',
    enum: AchievementCategory,
    default: AchievementCategory.ORDERS,
  })
  category: AchievementCategory;

  @Column({ type: 'varchar', length: 255, default: '/assets/icons/achievement-default.svg' })
  icon: string;

  @Column({ type: 'varchar', length: 50, default: '#4F46E5' })
  color: string;

  @Column({ type: 'int', name: 'points_awarded', default: 0 })
  pointsAwarded: number;

  @Column({
    type: 'enum',
    enum: AchievementConditionType,
    default: AchievementConditionType.COUNT,
    name: 'condition_type',
  })
  conditionType: AchievementConditionType;

  @Column({ type: 'int', name: 'condition_value', default: 1 })
  conditionValue: number;

  @Column({ type: 'varchar', length: 100, name: 'condition_entity', default: 'orders' })
  conditionEntity: string;

  @Column({ type: 'boolean', name: 'is_secret', default: false })
  isSecret: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => UserAchievement, (ua) => ua.achievement)
  userAchievements: UserAchievement[];
}
