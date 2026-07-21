import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('payment_gateways')
@Index(['code'])
@Index(['isActive'])
@Index(['isActive', 'displayOrder'])
export class PaymentGateway {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, unknown>;

  @Column({ type: 'varchar', length: 3, array: true, default: ['OMR'], name: 'supported_currencies' })
  supportedCurrencies: string[];

  @Column({ type: 'varchar', length: 50, array: true, default: [], name: 'supported_methods' })
  supportedMethods: string[];

  @Column({ type: 'boolean', default: false, name: 'is_sandbox' })
  isSandbox: boolean;

  @Column({ type: 'int', default: 0, name: 'display_order' })
  displayOrder: number;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  supportsCurrency(currency: string): boolean {
    return this.supportedCurrencies.includes(currency.toUpperCase());
  }

  supportsMethod(method: string): boolean {
    return this.supportedMethods.includes(method);
  }
}
