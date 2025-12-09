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

import type { DriverEntity } from './driver.entity.js';

// Import class for decorator metadata
import { DriverEntity as DriverEntityClass } from './driver.entity.js';

@Entity({ name: 'mapper' })
export class MapperEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => DriverEntityClass, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver!: DriverEntity | null;

  @Index()
  @Column({ name: 'driver_id', nullable: true })
  driverId!: string | null;

  @Index()
  @Column({ name: 'admin_id', type: 'uuid', nullable: true })
  adminId!: string | null;

  @Index()
  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId!: string;

  @Column({ name: 'old_sso_user_id', type: 'varchar', length: 255, nullable: true })
  oldSsoUserId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

