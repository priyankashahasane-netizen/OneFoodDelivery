import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity({ name: 'notifications' })
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  event!: string;

  @Index()
  @Column({ name: 'order_id', nullable: true })
  orderId!: string | null;

  @Column({ type: 'jsonb' })
  recipients!: string[];

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt!: Date;
}

