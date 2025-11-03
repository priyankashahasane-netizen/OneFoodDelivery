var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DriverEntity as DriverEntityClass } from '../../drivers/entities/driver.entity.js';
import { OrderEntity as OrderEntityClass } from '../../orders/entities/order.entity.js';
let RoutePlanEntity = class RoutePlanEntity {
    id;
    driver;
    driverId;
    order;
    orderId;
    stops;
    totalDistanceKm;
    etaPerStop;
    rawResponse;
    provider;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], RoutePlanEntity.prototype, "id", void 0);
__decorate([
    ManyToOne(() => DriverEntityClass, (driver) => driver.routePlans, { nullable: false }),
    JoinColumn({ name: 'driver_id' }),
    __metadata("design:type", Function)
], RoutePlanEntity.prototype, "driver", void 0);
__decorate([
    Column({ name: 'driver_id' }),
    __metadata("design:type", String)
], RoutePlanEntity.prototype, "driverId", void 0);
__decorate([
    ManyToOne(() => OrderEntityClass, (order) => order.routePlans),
    JoinColumn({ name: 'order_id' }),
    __metadata("design:type", Function)
], RoutePlanEntity.prototype, "order", void 0);
__decorate([
    Column({ name: 'order_id', nullable: true }),
    __metadata("design:type", String)
], RoutePlanEntity.prototype, "orderId", void 0);
__decorate([
    Column({ type: 'jsonb', name: 'stops', nullable: false }),
    __metadata("design:type", Array)
], RoutePlanEntity.prototype, "stops", void 0);
__decorate([
    Column({ type: 'float', name: 'total_distance_km', default: 0 }),
    __metadata("design:type", Number)
], RoutePlanEntity.prototype, "totalDistanceKm", void 0);
__decorate([
    Column({ type: 'jsonb', name: 'eta_per_stop', nullable: true }),
    __metadata("design:type", Array)
], RoutePlanEntity.prototype, "etaPerStop", void 0);
__decorate([
    Column({ type: 'jsonb', name: 'raw_response', nullable: true }),
    __metadata("design:type", Object)
], RoutePlanEntity.prototype, "rawResponse", void 0);
__decorate([
    Column({ name: 'provider', length: 32, default: 'optimoroute' }),
    __metadata("design:type", String)
], RoutePlanEntity.prototype, "provider", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], RoutePlanEntity.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ name: 'updated_at' }),
    __metadata("design:type", Date)
], RoutePlanEntity.prototype, "updatedAt", void 0);
RoutePlanEntity = __decorate([
    Entity({ name: 'route_plans' })
], RoutePlanEntity);
export { RoutePlanEntity };
