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

import type { DriverEntity } from './driver.entity.js';
import type { WithdrawalRequestEntity } from '../../wallet/entities/withdrawal-request.entity.js';

// Import classes for decorator metadata
import { DriverEntity as DriverEntityClass } from './driver.entity.js';
import { WithdrawalRequestEntity as WithdrawalRequestEntityClass } from '../../wallet/entities/withdrawal-request.entity.js';

@Entity({ name: 'driver_bank_accounts' })
export class DriverBankAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => DriverEntityClass, { nullable: false })
  @JoinColumn({ name: 'driver_id' })
  driver!: DriverEntity;

  @Index()
  @Column({ name: 'driver_id' })
  driverId!: string;

  @Column({ name: 'account_holder_name', length: 255 })
  accountHolderName!: string;

  @Column({ name: 'account_number', length: 50 })
  accountNumber!: string;

  @Column({ name: 'ifsc_code', length: 20 })
  ifscCode!: string;

  @Column({ name: 'bank_name', length: 255 })
  bankName!: string;

  @Column({ name: 'branch_name', length: 255, nullable: true })
  branchName!: string | null;

  @Column({ name: 'upi_id', length: 255, nullable: true })
  upiId!: string | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @OneToMany(() => WithdrawalRequestEntityClass, (withdrawal) => withdrawal.bankAccount)
  withdrawalRequests!: WithdrawalRequestEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

