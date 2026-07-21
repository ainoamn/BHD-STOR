import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PaymentTerms {
  PREPAID = 'prepaid',
  NET_15 = 'net_15',
  NET_30 = 'net_30',
}

export enum B2BCustomerStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

@Entity('b2b_customers')
export class B2BCustomer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  companyName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tradeLicense: string | null;

  @Column({ type: 'varchar', length: 100 })
  contactName: string;

  @Column({ type: 'varchar', length: 100 })
  contactEmail: string;

  @Column({ type: 'varchar', length: 20 })
  contactPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  apiKey: string | null;

  @Column({ type: 'boolean', default: false })
  apiEnabled: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  creditLimit: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  currentBalance: number;

  @Column({
    type: 'enum',
    enum: PaymentTerms,
    default: PaymentTerms.PREPAID,
  })
  paymentTerms: PaymentTerms;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountRate: number;

  @Column({ type: 'int', nullable: true })
  monthlyVolumeCommitment: number | null;

  @Column({
    type: 'enum',
    enum: B2BCustomerStatus,
    default: B2BCustomerStatus.ACTIVE,
  })
  status: B2BCustomerStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  webhookUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
