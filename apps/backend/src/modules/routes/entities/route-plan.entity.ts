import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import type { DriverEntity } from '../../drivers/entities/driver.entity.js';
import type { OrderEntity } from '../../orders/entities/order.entity.js';

// Import classes for decorator metadata
import { DriverEntity as DriverEntityClass } from '../../drivers/entities/driver.entity.js';
import { OrderEntity as OrderEntityClass } from '../../orders/entities/order.entity.js';

@Entity({ name: 'route_plans' })
export class RoutePlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => DriverEntityClass, (driver) => driver.routePlans, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver!: DriverEntity | null;

  @Column({ name: 'driver_id', nullable: true })
  driverId!: string | null;

  @ManyToOne(() => OrderEntityClass, (order) => order.routePlans)
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity | null;

  @Column({ name: 'order_id', nullable: true })
  orderId!: string | null;

  @Column({ length: 24, default: 'planned' })
  status!: string; // planned, active, completed, cancelled

  @Column({ type: 'jsonb', name: 'stops', nullable: false })
  stops!: Array<{ lat: number; lng: number; orderId?: string; eta?: string; id?: string; address?: string; serviceTimeSec?: number; sequencePosition?: number }>;

  @Column({ type: 'jsonb', nullable: true })
  sequence!: number[] | null;

  @Column({ type: 'text', nullable: true })
  polyline!: string | null;

  @Column({ type: 'float', name: 'total_distance_km', default: 0 })
  totalDistanceKm!: number;

  @Column({ name: 'estimated_duration_sec', type: 'int', nullable: true })
  estimatedDurationSec!: number | null;

  @Column({ type: 'jsonb', name: 'eta_per_stop', nullable: true })
  etaPerStop!: string[] | null;

  @Column({ name: 'assigned_at', type: 'timestamptz', nullable: true })
  assignedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  meta!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', name: 'raw_response', nullable: true })
  rawResponse!: Record<string, unknown> | null;

  @Column({ name: 'provider', length: 32, default: 'optimoroute' })
  provider!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


