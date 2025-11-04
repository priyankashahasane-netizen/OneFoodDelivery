var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DriverWalletEntity as DriverWalletEntityClass } from './driver-wallet.entity.js';
import { OrderEntity as OrderEntityClass } from '../../orders/entities/order.entity.js';
let WalletTransactionEntity = class WalletTransactionEntity {
    id;
    wallet;
    walletId;
    order;
    orderId;
    type;
    category;
    amount;
    description;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], WalletTransactionEntity.prototype, "id", void 0);
__decorate([
    ManyToOne(() => DriverWalletEntityClass, (wallet) => wallet.transactions, { nullable: false }),
    JoinColumn({ name: 'wallet_id' }),
    __metadata("design:type", Function)
], WalletTransactionEntity.prototype, "wallet", void 0);
__decorate([
    Index(),
    Column({ name: 'wallet_id' }),
    __metadata("design:type", String)
], WalletTransactionEntity.prototype, "walletId", void 0);
__decorate([
    ManyToOne(() => OrderEntityClass, { nullable: true }),
    JoinColumn({ name: 'order_id' }),
    __metadata("design:type", Function)
], WalletTransactionEntity.prototype, "order", void 0);
__decorate([
    Index(),
    Column({ name: 'order_id', nullable: true }),
    __metadata("design:type", String)
], WalletTransactionEntity.prototype, "orderId", void 0);
__decorate([
    Column({ length: 32 }),
    __metadata("design:type", String)
], WalletTransactionEntity.prototype, "type", void 0);
__decorate([
    Column({ length: 64 }),
    __metadata("design:type", String)
], WalletTransactionEntity.prototype, "category", void 0);
__decorate([
    Column({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], WalletTransactionEntity.prototype, "amount", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WalletTransactionEntity.prototype, "description", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], WalletTransactionEntity.prototype, "createdAt", void 0);
WalletTransactionEntity = __decorate([
    Entity({ name: 'wallet_transactions' })
], WalletTransactionEntity);
export { WalletTransactionEntity };
