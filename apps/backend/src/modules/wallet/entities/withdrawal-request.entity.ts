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
import type { DriverBankAccountEntity } from '../../drivers/entities/driver-bank-account.entity.js';

// Import classes for decorator metadata
import { DriverEntity as DriverEntityClass } from '../../drivers/entities/driver.entity.js';
import { DriverBankAccountEntity as DriverBankAccountEntityClass } from '../../drivers/entities/driver-bank-account.entity.js';

@Entity({ name: 'withdrawal_requests' })
export class WithdrawalRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => DriverEntityClass, { nullable: false })
  @JoinColumn({ name: 'driver_id' })
  driver!: DriverEntity;

  @Index()
  @Column({ name: 'driver_id' })
  driverId!: string;

  @ManyToOne(() => DriverBankAccountEntityClass, { nullable: true })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount!: DriverBankAccountEntity | null;

  @Column({ name: 'bank_account_id', nullable: true })
  bankAccountId!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ length: 32, default: 'requested' })
  status!: string; // requested, processing, completed, failed

  @CreateDateColumn({ name: 'requested_at' })
  requestedAt!: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null;

  @Column({ name: 'txn_ref', length: 255, nullable: true })
  txnRef!: string | null;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;
}

