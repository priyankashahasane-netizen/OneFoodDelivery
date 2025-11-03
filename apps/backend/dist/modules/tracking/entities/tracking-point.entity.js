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
import { OrderEntity as OrderEntityClass } from '../../orders/entities/order.entity.js';
let TrackingPointEntity = class TrackingPointEntity {
    id;
    order;
    orderId;
    driver;
    driverId;
    latitude;
    longitude;
    speed;
    heading;
    recordedAt;
    metadata;
    createdAt;
    ingestSequence;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], TrackingPointEntity.prototype, "id", void 0);
__decorate([
    ManyToOne(() => OrderEntityClass, (order) => order.trackingPoints, { nullable: false }),
    JoinColumn({ name: 'order_id' }),
    __metadata("design:type", Function)
], TrackingPointEntity.prototype, "order", void 0);
__decorate([
    Column({ name: 'order_id' }),
    __metadata("design:type", String)
], TrackingPointEntity.prototype, "orderId", void 0);
__decorate([
    ManyToOne(() => DriverEntityClass, (driver) => driver.trackingPoints, { nullable: false }),
    JoinColumn({ name: 'driver_id' }),
    __metadata("design:type", Function)
], TrackingPointEntity.prototype, "driver", void 0);
__decorate([
    Column({ name: 'driver_id' }),
    __metadata("design:type", String)
], TrackingPointEntity.prototype, "driverId", void 0);
__decorate([
    Column({ type: 'float' }),
    __metadata("design:type", Number)
], TrackingPointEntity.prototype, "latitude", void 0);
__decorate([
    Column({ type: 'float' }),
    __metadata("design:type", Number)
], TrackingPointEntity.prototype, "longitude", void 0);
__decorate([
    Column({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], TrackingPointEntity.prototype, "speed", void 0);
__decorate([
    Column({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], TrackingPointEntity.prototype, "heading", void 0);
__decorate([
    Column({ name: 'recorded_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], TrackingPointEntity.prototype, "recordedAt", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TrackingPointEntity.prototype, "metadata", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], TrackingPointEntity.prototype, "createdAt", void 0);
__decorate([
    Index(),
    Column({ name: 'ingest_sequence', type: 'bigint', generated: 'increment' }),
    __metadata("design:type", String)
], TrackingPointEntity.prototype, "ingestSequence", void 0);
TrackingPointEntity = __decorate([
    Entity({ name: 'tracking_points' })
], TrackingPointEntity);
export { TrackingPointEntity };
