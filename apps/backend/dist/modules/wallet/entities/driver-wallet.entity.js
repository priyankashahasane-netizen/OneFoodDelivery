var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DriverEntity as DriverEntityClass } from '../../drivers/entities/driver.entity.js';
import { WalletTransactionEntity as WalletTransactionEntityClass } from './wallet-transaction.entity.js';
let DriverWalletEntity = class DriverWalletEntity {
    id;
    driver;
    driverId;
    balance;
    currency;
    transactions;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], DriverWalletEntity.prototype, "id", void 0);
__decorate([
    ManyToOne(() => DriverEntityClass, { nullable: false }),
    JoinColumn({ name: 'driver_id' }),
    __metadata("design:type", Function)
], DriverWalletEntity.prototype, "driver", void 0);
__decorate([
    Index(),
    Column({ name: 'driver_id', unique: true }),
    __metadata("design:type", String)
], DriverWalletEntity.prototype, "driverId", void 0);
__decorate([
    Column({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DriverWalletEntity.prototype, "balance", void 0);
__decorate([
    Column({ length: 3, default: 'INR' }),
    __metadata("design:type", String)
], DriverWalletEntity.prototype, "currency", void 0);
__decorate([
    OneToMany(() => WalletTransactionEntityClass, (transaction) => transaction.wallet),
    __metadata("design:type", Array)
], DriverWalletEntity.prototype, "transactions", void 0);
__decorate([
    UpdateDateColumn({ name: 'updated_at' }),
    __metadata("design:type", Date)
], DriverWalletEntity.prototype, "updatedAt", void 0);
DriverWalletEntity = __decorate([
    Entity({ name: 'driver_wallets' })
], DriverWalletEntity);
export { DriverWalletEntity };
