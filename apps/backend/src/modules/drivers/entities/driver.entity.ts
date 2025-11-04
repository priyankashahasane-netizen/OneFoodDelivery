import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import type { RoutePlanEntity } from '../../routes/entities/route-plan.entity.js';
import type { TrackingPointEntity } from '../../tracking/entities/tracking-point.entity.js';

// Import classes for decorator metadata
import { RoutePlanEntity as RoutePlanEntityClass } from '../../routes/entities/route-plan.entity.js';
import { TrackingPointEntity as TrackingPointEntityClass } from '../../tracking/entities/tracking-point.entity.js';

@Entity({ name: 'drivers' })
export class DriverEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ length: 20, unique: true })
  phone!: string;

  @Column({ name: 'vehicle_type', length: 32 })
  vehicleType!: string;

  @Column({ type: 'int', default: 0 })
  capacity!: number;

  @Column({ type: 'boolean', default: false })
  online!: boolean;

  @Column({ length: 24, default: 'offline' })
  status!: string; // online, offline, busy

  @Column({ name: 'rating_avg', type: 'float', nullable: true })
  ratingAvg!: number | null;

  @Column({ name: 'kyc_status', length: 32, nullable: true })
  kycStatus!: string | null;

  @Column({ type: 'float', nullable: true })
  latitude!: number | null;

  @Column({ type: 'float', nullable: true })
  longitude!: number | null;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt!: Date | null;

  @Column({ name: 'ip_address', length: 64, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @OneToMany(() => RoutePlanEntityClass, (routePlan) => routePlan.driver)
  routePlans!: RoutePlanEntity[];

  @OneToMany(() => TrackingPointEntityClass, (point) => point.driver)
  trackingPoints!: TrackingPointEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Index()
  @Column({ name: 'zone_id', nullable: true })
  zoneId!: string | null;
}


