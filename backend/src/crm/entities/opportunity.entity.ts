import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomerContact } from './customer-contact.entity';

export enum OpportunityStage {
  PROSPECTING = 'prospecting',
  QUALIFICATION = 'qualification',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

@Entity('opportunities')
export class Opportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  contactId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  value: number;

  @Column({
    type: 'enum',
    enum: OpportunityStage,
    default: OpportunityStage.PROSPECTING,
  })
  stage: OpportunityStage;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  probability: number;

  @Column({ type: 'timestamp' })
  expectedCloseDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualCloseDate: Date | null;

  @Column({ type: 'uuid' })
  assignedTo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => CustomerContact, (contact) => contact.opportunities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contactId' })
  contact: CustomerContact;
}
