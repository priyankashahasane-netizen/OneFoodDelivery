var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { RoutePlanEntity as RoutePlanEntityClass } from '../../routes/entities/route-plan.entity.js';
import { TrackingPointEntity as TrackingPointEntityClass } from '../../tracking/entities/tracking-point.entity.js';
let DriverEntity = class DriverEntity {
    id;
    name;
    phone;
    vehicleType;
    capacity;
    online;
    latitude;
    longitude;
    lastSeenAt;
    ipAddress;
    metadata;
    routePlans;
    trackingPoints;
    createdAt;
    updatedAt;
    zoneId;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], DriverEntity.prototype, "id", void 0);
__decorate([
    Column({ length: 120 }),
    __metadata("design:type", String)
], DriverEntity.prototype, "name", void 0);
__decorate([
    Column({ length: 20, unique: true }),
    __metadata("design:type", String)
], DriverEntity.prototype, "phone", void 0);
__decorate([
    Column({ name: 'vehicle_type', length: 32 }),
    __metadata("design:type", String)
], DriverEntity.prototype, "vehicleType", void 0);
__decorate([
    Column({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DriverEntity.prototype, "capacity", void 0);
__decorate([
    Column({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], DriverEntity.prototype, "online", void 0);
__decorate([
    Column({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], DriverEntity.prototype, "latitude", void 0);
__decorate([
    Column({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], DriverEntity.prototype, "longitude", void 0);
__decorate([
    Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], DriverEntity.prototype, "lastSeenAt", void 0);
__decorate([
    Column({ name: 'ip_address', length: 64, nullable: true }),
    __metadata("design:type", String)
], DriverEntity.prototype, "ipAddress", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], DriverEntity.prototype, "metadata", void 0);
__decorate([
    OneToMany(() => RoutePlanEntityClass, (routePlan) => routePlan.driver),
    __metadata("design:type", Array)
], DriverEntity.prototype, "routePlans", void 0);
__decorate([
    OneToMany(() => TrackingPointEntityClass, (point) => point.driver),
    __metadata("design:type", Array)
], DriverEntity.prototype, "trackingPoints", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], DriverEntity.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ name: 'updated_at' }),
    __metadata("design:type", Date)
], DriverEntity.prototype, "updatedAt", void 0);
__decorate([
    Index(),
    Column({ name: 'zone_id', nullable: true }),
    __metadata("design:type", String)
], DriverEntity.prototype, "zoneId", void 0);
DriverEntity = __decorate([
    Entity({ name: 'drivers' })
], DriverEntity);
export { DriverEntity };
