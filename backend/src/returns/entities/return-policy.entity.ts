import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('return_policies')
@Index(['storeId'])
export class ReturnPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  storeId: string;

  @Column({ type: 'int', default: 14 })
  returnWindow: number;

  @Column({ type: 'int', default: 14 })
  exchangeWindow: number;

  @Column({ type: 'simple-array', nullable: true, default: '' })
  conditions: string[];

  @Column({ type: 'simple-array', nullable: true, default: '' })
  nonReturnableCategories: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  restockingFee: number;

  @Column({ type: 'boolean', default: false })
  autoApprove: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
