import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import type { DriverEntity } from '../../drivers/entities/driver.entity.js';
import type { RoutePlanEntity } from '../../routes/entities/route-plan.entity.js';

// Import classes for decorator metadata
import { DriverEntity as DriverEntityClass } from '../../drivers/entities/driver.entity.js';
import { RoutePlanEntity as RoutePlanEntityClass } from '../../routes/entities/route-plan.entity.js';

@Entity({ name: 'smart_paths' })
export class SmartPathEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => DriverEntityClass, { nullable: false })
  @JoinColumn({ name: 'driver_id' })
  driver!: DriverEntity;

  @Index()
  @Column({ name: 'driver_id' })
  driverId!: string;

  @Column({ type: 'jsonb', name: 'pickup_location' })
  pickupLocation!: { lat: number; lng: number; address?: string };

  @Column({ type: 'jsonb', name: 'order_ids' })
  orderIds!: string[]; // Array of order IDs in this Smart Path group

  @ManyToOne(() => RoutePlanEntityClass, { nullable: true })
  @JoinColumn({ name: 'route_plan_id' })
  routePlan!: RoutePlanEntity | null;

  @Column({ name: 'route_plan_id', nullable: true })
  routePlanId!: string | null;

  @Column({ length: 24, default: 'planned' })
  status!: string; // planned, active, completed, cancelled

  @Column({ type: 'date', name: 'target_date' })
  targetDate!: Date; // The date this Smart Path is for (today)

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
