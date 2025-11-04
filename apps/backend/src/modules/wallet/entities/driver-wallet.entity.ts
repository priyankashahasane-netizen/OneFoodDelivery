import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import type { DriverEntity } from '../../drivers/entities/driver.entity.js';
import type { WalletTransactionEntity } from './wallet-transaction.entity.js';

// Import classes for decorator metadata
import { DriverEntity as DriverEntityClass } from '../../drivers/entities/driver.entity.js';
import { WalletTransactionEntity as WalletTransactionEntityClass } from './wallet-transaction.entity.js';

@Entity({ name: 'driver_wallets' })
export class DriverWalletEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => DriverEntityClass, { nullable: false })
  @JoinColumn({ name: 'driver_id' })
  driver!: DriverEntity;

  @Index()
  @Column({ name: 'driver_id', unique: true })
  driverId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance!: number;

  @Column({ length: 3, default: 'INR' })
  currency!: string;

  @OneToMany(() => WalletTransactionEntityClass, (transaction) => transaction.wallet)
  transactions!: WalletTransactionEntity[];

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

