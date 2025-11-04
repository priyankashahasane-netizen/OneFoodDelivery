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
import { DriverEntity as DriverEntityClass } from '../../drivers/entities/driver.entity.js';
import { DriverBankAccountEntity as DriverBankAccountEntityClass } from '../../drivers/entities/driver-bank-account.entity.js';
let WithdrawalRequestEntity = class WithdrawalRequestEntity {
    id;
    driver;
    driverId;
    bankAccount;
    bankAccountId;
    amount;
    status;
    requestedAt;
    processedAt;
    txnRef;
    remarks;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], WithdrawalRequestEntity.prototype, "id", void 0);
__decorate([
    ManyToOne(() => DriverEntityClass, { nullable: false }),
    JoinColumn({ name: 'driver_id' }),
    __metadata("design:type", Function)
], WithdrawalRequestEntity.prototype, "driver", void 0);
__decorate([
    Index(),
    Column({ name: 'driver_id' }),
    __metadata("design:type", String)
], WithdrawalRequestEntity.prototype, "driverId", void 0);
__decorate([
    ManyToOne(() => DriverBankAccountEntityClass, { nullable: true }),
    JoinColumn({ name: 'bank_account_id' }),
    __metadata("design:type", Function)
], WithdrawalRequestEntity.prototype, "bankAccount", void 0);
__decorate([
    Column({ name: 'bank_account_id', nullable: true }),
    __metadata("design:type", String)
], WithdrawalRequestEntity.prototype, "bankAccountId", void 0);
__decorate([
    Column({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], WithdrawalRequestEntity.prototype, "amount", void 0);
__decorate([
    Column({ length: 32, default: 'requested' }),
    __metadata("design:type", String)
], WithdrawalRequestEntity.prototype, "status", void 0);
__decorate([
    CreateDateColumn({ name: 'requested_at' }),
    __metadata("design:type", Date)
], WithdrawalRequestEntity.prototype, "requestedAt", void 0);
__decorate([
    Column({ name: 'processed_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], WithdrawalRequestEntity.prototype, "processedAt", void 0);
__decorate([
    Column({ name: 'txn_ref', length: 255, nullable: true }),
    __metadata("design:type", String)
], WithdrawalRequestEntity.prototype, "txnRef", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WithdrawalRequestEntity.prototype, "remarks", void 0);
WithdrawalRequestEntity = __decorate([
    Entity({ name: 'withdrawal_requests' })
], WithdrawalRequestEntity);
export { WithdrawalRequestEntity };
