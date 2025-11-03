import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import type { DriverEntity } from '../../drivers/entities/driver.entity.js';
import type { OrderEntity } from '../../orders/entities/order.entity.js';

// Import classes for decorator metadata
import { DriverEntity as DriverEntityClass } from '../../drivers/entities/driver.entity.js';
import { OrderEntity as OrderEntityClass } from '../../orders/entities/order.entity.js';

@Entity({ name: 'tracking_points' })
export class TrackingPointEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => OrderEntityClass, (order) => order.trackingPoints, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;

  @Column({ name: 'order_id' })
  orderId!: string;

  @ManyToOne(() => DriverEntityClass, (driver) => driver.trackingPoints, { nullable: false })
  @JoinColumn({ name: 'driver_id' })
  driver!: DriverEntity;

  @Column({ name: 'driver_id' })
  driverId!: string;

  @Column({ type: 'float' })
  latitude!: number;

  @Column({ type: 'float' })
  longitude!: number;

  @Column({ type: 'float', nullable: true })
  speed!: number | null;

  @Column({ type: 'float', nullable: true })
  heading!: number | null;

  @Column({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Index()
  @Column({ name: 'ingest_sequence', type: 'bigint', generated: 'increment' })
  ingestSequence!: string;
}


