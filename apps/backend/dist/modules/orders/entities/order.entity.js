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
import { DriverEntity as DriverEntityClass } from '../../drivers/entities/driver.entity.js';
import { RoutePlanEntity as RoutePlanEntityClass } from '../../routes/entities/route-plan.entity.js';
import { TrackingPointEntity as TrackingPointEntityClass } from '../../tracking/entities/tracking-point.entity.js';
let OrderEntity = class OrderEntity {
    id;
    externalRef;
    pickup;
    dropoff;
    status;
    items;
    paymentType;
    slaSeconds;
    trackingUrl;
    assignedAt;
    driver;
    driverId;
    trackingPoints;
    routePlans;
    zoneId;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], OrderEntity.prototype, "id", void 0);
__decorate([
    Column({ name: 'external_ref', length: 120, nullable: true }),
    __metadata("design:type", String)
], OrderEntity.prototype, "externalRef", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Object)
], OrderEntity.prototype, "pickup", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Object)
], OrderEntity.prototype, "dropoff", void 0);
__decorate([
    Column({ length: 24 }),
    __metadata("design:type", String)
], OrderEntity.prototype, "status", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], OrderEntity.prototype, "items", void 0);
__decorate([
    Column({ name: 'payment_type', length: 32 }),
    __metadata("design:type", String)
], OrderEntity.prototype, "paymentType", void 0);
__decorate([
    Column({ name: 'sla_seconds', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], OrderEntity.prototype, "slaSeconds", void 0);
__decorate([
    Column({ name: 'tracking_url', length: 255, nullable: true }),
    __metadata("design:type", String)
], OrderEntity.prototype, "trackingUrl", void 0);
__decorate([
    Column({ name: 'assigned_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], OrderEntity.prototype, "assignedAt", void 0);
__decorate([
    ManyToOne(() => DriverEntityClass, (driver) => driver.routePlans, { nullable: true }),
    JoinColumn({ name: 'driver_id' }),
    __metadata("design:type", Function)
], OrderEntity.prototype, "driver", void 0);
__decorate([
    Column({ name: 'driver_id', nullable: true }),
    __metadata("design:type", String)
], OrderEntity.prototype, "driverId", void 0);
__decorate([
    OneToMany(() => TrackingPointEntityClass, (point) => point.order),
    __metadata("design:type", Array)
], OrderEntity.prototype, "trackingPoints", void 0);
__decorate([
    OneToMany(() => RoutePlanEntityClass, (plan) => plan.order),
    __metadata("design:type", Array)
], OrderEntity.prototype, "routePlans", void 0);
__decorate([
    Index(),
    Column({ name: 'zone_id', nullable: true }),
    __metadata("design:type", String)
], OrderEntity.prototype, "zoneId", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], OrderEntity.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ name: 'updated_at' }),
    __metadata("design:type", Date)
], OrderEntity.prototype, "updatedAt", void 0);
OrderEntity = __decorate([
    Entity({ name: 'orders' })
], OrderEntity);
export { OrderEntity };
