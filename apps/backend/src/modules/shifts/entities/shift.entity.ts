import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn
} from 'typeorm';

import type { DriverEntity } from '../../drivers/entities/driver.entity.js';

// Import class for decorator metadata
import { DriverEntity as DriverEntityClass } from '../../drivers/entities/driver.entity.js';

@Entity({ name: 'shifts' })
export class ShiftEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({ type: 'int', default: 1 })
  status!: number; // 1 = active, 0 = inactive

  @ManyToOne(() => DriverEntityClass, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver!: DriverEntity | null;

  @Column({ name: 'driver_id', nullable: true })
  driverId!: string | null;

  @Index()
  @Column({ name: 'zone_id', nullable: true })
  zoneId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}




