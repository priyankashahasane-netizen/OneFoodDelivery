var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DriverEntity as DriverEntityClass } from '../../drivers/entities/driver.entity.js';
import { OrderEntity as OrderEntityClass } from './order.entity.js';
let ProofOfDeliveryEntity = class ProofOfDeliveryEntity {
    id;
    order;
    orderId;
    driver;
    driverId;
    photoUrl;
    signatureUrl;
    notes;
    otpCode;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], ProofOfDeliveryEntity.prototype, "id", void 0);
__decorate([
    ManyToOne(() => OrderEntityClass, { nullable: false }),
    JoinColumn({ name: 'order_id' }),
    __metadata("design:type", Function)
], ProofOfDeliveryEntity.prototype, "order", void 0);
__decorate([
    Column({ name: 'order_id' }),
    __metadata("design:type", String)
], ProofOfDeliveryEntity.prototype, "orderId", void 0);
__decorate([
    ManyToOne(() => DriverEntityClass, { nullable: true }),
    JoinColumn({ name: 'driver_id' }),
    __metadata("design:type", Function)
], ProofOfDeliveryEntity.prototype, "driver", void 0);
__decorate([
    Column({ name: 'driver_id', nullable: true }),
    __metadata("design:type", String)
], ProofOfDeliveryEntity.prototype, "driverId", void 0);
__decorate([
    Column({ name: 'photo_url', type: 'text' }),
    __metadata("design:type", String)
], ProofOfDeliveryEntity.prototype, "photoUrl", void 0);
__decorate([
    Column({ name: 'signature_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], ProofOfDeliveryEntity.prototype, "signatureUrl", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ProofOfDeliveryEntity.prototype, "notes", void 0);
__decorate([
    Column({ name: 'otp_code', length: 10, nullable: true }),
    __metadata("design:type", String)
], ProofOfDeliveryEntity.prototype, "otpCode", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], ProofOfDeliveryEntity.prototype, "createdAt", void 0);
ProofOfDeliveryEntity = __decorate([
    Entity({ name: 'proof_of_deliveries' })
], ProofOfDeliveryEntity);
export { ProofOfDeliveryEntity };
