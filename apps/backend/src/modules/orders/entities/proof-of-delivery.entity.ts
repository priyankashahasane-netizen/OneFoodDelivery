import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import type { DriverEntity } from '../../drivers/entities/driver.entity.js';
import type { OrderEntity } from './order.entity.js';

// Import classes for decorator metadata
import { DriverEntity as DriverEntityClass } from '../../drivers/entities/driver.entity.js';
import { OrderEntity as OrderEntityClass } from './order.entity.js';

@Entity({ name: 'proof_of_deliveries' })
export class ProofOfDeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => OrderEntityClass, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;

  @Column({ name: 'order_id' })
  orderId!: string;

  @ManyToOne(() => DriverEntityClass, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver!: DriverEntity | null;

  @Column({ name: 'driver_id', nullable: true })
  driverId!: string | null;

  @Column({ name: 'photo_url', type: 'text' })
  photoUrl!: string;

  @Column({ name: 'signature_url', type: 'text', nullable: true })
  signatureUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'otp_code', length: 10, nullable: true })
  otpCode!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

