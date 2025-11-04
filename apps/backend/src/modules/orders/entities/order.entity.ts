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
import type { TrackingPointEntity } from '../../tracking/entities/tracking-point.entity.js';

// Import classes for decorator metadata
import { DriverEntity as DriverEntityClass } from '../../drivers/entities/driver.entity.js';
import { RoutePlanEntity as RoutePlanEntityClass } from '../../routes/entities/route-plan.entity.js';
import { TrackingPointEntity as TrackingPointEntityClass } from '../../tracking/entities/tracking-point.entity.js';

@Entity({ name: 'orders' })
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'external_ref', length: 120, nullable: true })
  externalRef!: string | null;

  @Column({ type: 'jsonb' })
  pickup!: { lat: number; lng: number; address?: string };

  @Column({ type: 'jsonb' })
  dropoff!: { lat: number; lng: number; address?: string };

  @Column({ length: 24 })
  status!: string;

  @Column({ type: 'jsonb', nullable: true })
  items!: unknown[] | null;

  @Column({ name: 'payment_type', length: 32 })
  paymentType!: string;

  @Column({ name: 'sla_seconds', type: 'int', default: 0 })
  slaSeconds!: number;

  @Column({ name: 'tracking_url', length: 255, nullable: true })
  trackingUrl!: string | null;

  @Column({ name: 'assigned_at', type: 'timestamptz', nullable: true })
  assignedAt!: Date | null;

  @ManyToOne(() => DriverEntityClass, (driver) => driver.routePlans, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver!: DriverEntity | null;

  @Column({ name: 'driver_id', nullable: true })
  driverId!: string | null;

  @OneToMany(() => TrackingPointEntityClass, (point) => point.order)
  trackingPoints!: TrackingPointEntity[];

  @OneToMany(() => RoutePlanEntityClass, (plan) => plan.order)
  routePlans!: RoutePlanEntity[];

  @Index()
  @Column({ name: 'zone_id', nullable: true })
  zoneId!: string | null;

  @Column({ name: 'subscription_id', nullable: true })
  subscriptionId!: string | null;

  @Column({ name: 'cancellation_source', length: 32, nullable: true })
  cancellationSource!: string | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason!: string | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


