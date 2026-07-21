import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomerContact } from './customer-contact.entity';

export enum InteractionType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  WHATSAPP = 'whatsapp',
  NOTE = 'note',
  TASK = 'task',
}

export enum InteractionDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

@Entity('interactions')
export class Interaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  contactId: string;

  @Column({
    type: 'enum',
    enum: InteractionType,
  })
  type: InteractionType;

  @Column({
    type: 'enum',
    enum: InteractionDirection,
    default: InteractionDirection.OUTBOUND,
  })
  direction: InteractionDirection;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => CustomerContact, (contact) => contact.interactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contactId' })
  contact: CustomerContact;
}
