import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Interaction } from './interaction.entity';
import { Opportunity } from './opportunity.entity';

export enum ContactSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social_media',
  B2B_PORTAL = 'b2b_portal',
  WHATSAPP = 'whatsapp',
  OTHER = 'other',
}

export enum ContactStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost',
}

@Entity('customer_contacts')
export class CustomerContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company: string | null;

  @Column({
    type: 'enum',
    enum: ContactSource,
    default: ContactSource.WEBSITE,
  })
  source: ContactSource;

  @Column({
    type: 'enum',
    enum: ContactStatus,
    default: ContactStatus.NEW,
  })
  status: ContactStatus;

  @Column({ type: 'uuid', nullable: true })
  assignedTo: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'simple-array', default: '' })
  tags: string[];

  @Column({ type: 'timestamp', nullable: true })
  lastContactDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  nextFollowUpDate: Date | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  estimatedValue: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Interaction, (interaction) => interaction.contact, {
    cascade: true,
  })
  interactions: Interaction[];

  @OneToMany(() => Opportunity, (opportunity) => opportunity.contact, {
    cascade: true,
  })
  opportunities: Opportunity[];
}
