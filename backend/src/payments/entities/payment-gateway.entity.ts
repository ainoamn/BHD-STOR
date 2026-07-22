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
export class PaymentGateway {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'api_key' })
  apiKey: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'api_secret' })
  apiSecret: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'api_endpoint' })
  apiEndpoint: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'webhook_secret' })
  webhookSecret: string | null;

  /** Maps to DB column `sandbox_mode` (migration 001). */
  @Column({ type: 'boolean', default: true, name: 'sandbox_mode' })
  isSandbox: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'supported_methods' })
  supportedMethods: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, unknown> | null;

  @Column({ type: 'int', default: 0, name: 'display_order' })
  displayOrder: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  get supportedCurrencies(): string[] {
    const fromConfig = this.config?.supported_currencies;
    if (Array.isArray(fromConfig) && fromConfig.length > 0) {
      return fromConfig.map(String);
    }
    return ['OMR'];
  }

  supportsCurrency(currency: string): boolean {
    return this.supportedCurrencies.includes(currency.toUpperCase());
  }

  supportsMethod(method: string): boolean {
    return (this.supportedMethods || []).includes(method);
  }
}
