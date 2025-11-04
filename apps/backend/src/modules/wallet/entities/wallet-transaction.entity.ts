import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import type { DriverWalletEntity } from './driver-wallet.entity.js';
import type { OrderEntity } from '../../orders/entities/order.entity.js';

// Import classes for decorator metadata
import { DriverWalletEntity as DriverWalletEntityClass } from './driver-wallet.entity.js';
import { OrderEntity as OrderEntityClass } from '../../orders/entities/order.entity.js';

@Entity({ name: 'wallet_transactions' })
export class WalletTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => DriverWalletEntityClass, (wallet) => wallet.transactions, { nullable: false })
  @JoinColumn({ name: 'wallet_id' })
  wallet!: DriverWalletEntity;

  @Index()
  @Column({ name: 'wallet_id' })
  walletId!: string;

  @ManyToOne(() => OrderEntityClass, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity | null;

  @Index()
  @Column({ name: 'order_id', nullable: true })
  orderId!: string | null;

  @Column({ length: 32 })
  type!: string; // credit, debit

  @Column({ length: 64 })
  category!: string; // delivery_fee, bonus, penalty, withdrawal

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

