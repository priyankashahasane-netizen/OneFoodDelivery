import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import type { SubscriptionEntity } from './subscription.entity.js';
import type { OrderEntity } from '../../orders/entities/order.entity.js';

// Import classes for decorator metadata
import { SubscriptionEntity as SubscriptionEntityClass } from './subscription.entity.js';
import { OrderEntity as OrderEntityClass } from '../../orders/entities/order.entity.js';

@Entity({ name: 'subscription_executions' })
export class SubscriptionExecutionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => SubscriptionEntityClass, (subscription) => subscription.executions, { nullable: false })
  @JoinColumn({ name: 'subscription_id' })
  subscription!: SubscriptionEntity;

  @Index()
  @Column({ name: 'subscription_id' })
  subscriptionId!: string;

  @ManyToOne(() => OrderEntityClass, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity | null;

  @Column({ name: 'order_id', nullable: true })
  orderId!: string | null;

  @Column({ name: 'scheduled_for', type: 'timestamptz' })
  scheduledFor!: Date;

  @Column({ length: 32, default: 'scheduled' })
  status!: string; // scheduled, completed, skipped, failed

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

