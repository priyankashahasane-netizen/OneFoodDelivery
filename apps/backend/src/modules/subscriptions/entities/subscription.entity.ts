import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import type { DriverEntity } from '../../drivers/entities/driver.entity.js';
import type { RoutePlanEntity } from '../../routes/entities/route-plan.entity.js';
import type { SubscriptionExecutionEntity } from './subscription-execution.entity.js';

// Import classes for decorator metadata
import { DriverEntity as DriverEntityClass } from '../../drivers/entities/driver.entity.js';
import { RoutePlanEntity as RoutePlanEntityClass } from '../../routes/entities/route-plan.entity.js';
import { SubscriptionExecutionEntity as SubscriptionExecutionEntityClass } from './subscription-execution.entity.js';

@Entity({ name: 'subscriptions' })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_template_id', length: 255 })
  orderTemplateId!: string;

  @ManyToOne(() => DriverEntityClass, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver!: DriverEntity | null;

  @Index()
  @Column({ name: 'driver_id', nullable: true })
  driverId!: string | null;

  @ManyToOne(() => RoutePlanEntityClass, { nullable: true })
  @JoinColumn({ name: 'route_plan_id' })
  routePlan!: RoutePlanEntity | null;

  @Column({ name: 'route_plan_id', nullable: true })
  routePlanId!: string | null;

  @Column({ length: 32 })
  frequency!: string; // daily, weekly, custom

  @Column({ name: 'days_of_week', type: 'jsonb', nullable: true })
  daysOfWeek!: string[] | null;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: Date | null;

  @Column({ name: 'next_delivery_at', type: 'timestamptz', nullable: true })
  nextDeliveryAt!: Date | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @OneToMany(() => SubscriptionExecutionEntityClass, (execution) => execution.subscription)
  executions!: SubscriptionExecutionEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

