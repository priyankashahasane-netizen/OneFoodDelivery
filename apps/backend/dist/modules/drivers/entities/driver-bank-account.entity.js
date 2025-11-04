var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DriverEntity as DriverEntityClass } from './driver.entity.js';
import { WithdrawalRequestEntity as WithdrawalRequestEntityClass } from '../../wallet/entities/withdrawal-request.entity.js';
let DriverBankAccountEntity = class DriverBankAccountEntity {
    id;
    driver;
    driverId;
    accountHolderName;
    accountNumber;
    ifscCode;
    bankName;
    branchName;
    upiId;
    isVerified;
    withdrawalRequests;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], DriverBankAccountEntity.prototype, "id", void 0);
__decorate([
    ManyToOne(() => DriverEntityClass, { nullable: false }),
    JoinColumn({ name: 'driver_id' }),
    __metadata("design:type", Function)
], DriverBankAccountEntity.prototype, "driver", void 0);
__decorate([
    Index(),
    Column({ name: 'driver_id' }),
    __metadata("design:type", String)
], DriverBankAccountEntity.prototype, "driverId", void 0);
__decorate([
    Column({ name: 'account_holder_name', length: 255 }),
    __metadata("design:type", String)
], DriverBankAccountEntity.prototype, "accountHolderName", void 0);
__decorate([
    Column({ name: 'account_number', length: 50 }),
    __metadata("design:type", String)
], DriverBankAccountEntity.prototype, "accountNumber", void 0);
__decorate([
    Column({ name: 'ifsc_code', length: 20 }),
    __metadata("design:type", String)
], DriverBankAccountEntity.prototype, "ifscCode", void 0);
__decorate([
    Column({ name: 'bank_name', length: 255 }),
    __metadata("design:type", String)
], DriverBankAccountEntity.prototype, "bankName", void 0);
__decorate([
    Column({ name: 'branch_name', length: 255, nullable: true }),
    __metadata("design:type", String)
], DriverBankAccountEntity.prototype, "branchName", void 0);
__decorate([
    Column({ name: 'upi_id', length: 255, nullable: true }),
    __metadata("design:type", String)
], DriverBankAccountEntity.prototype, "upiId", void 0);
__decorate([
    Column({ name: 'is_verified', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], DriverBankAccountEntity.prototype, "isVerified", void 0);
__decorate([
    OneToMany(() => WithdrawalRequestEntityClass, (withdrawal) => withdrawal.bankAccount),
    __metadata("design:type", Array)
], DriverBankAccountEntity.prototype, "withdrawalRequests", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], DriverBankAccountEntity.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ name: 'updated_at' }),
    __metadata("design:type", Date)
], DriverBankAccountEntity.prototype, "updatedAt", void 0);
DriverBankAccountEntity = __decorate([
    Entity({ name: 'driver_bank_accounts' })
], DriverBankAccountEntity);
export { DriverBankAccountEntity };
