var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { DriverEntity as DriverEntityClass } from '../../drivers/entities/driver.entity.js';
let ShiftEntity = class ShiftEntity {
    id;
    name;
    startTime;
    endTime;
    status;
    driver;
    driverId;
    zoneId;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], ShiftEntity.prototype, "id", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], ShiftEntity.prototype, "name", void 0);
__decorate([
    Column({ name: 'start_time', type: 'time' }),
    __metadata("design:type", String)
], ShiftEntity.prototype, "startTime", void 0);
__decorate([
    Column({ name: 'end_time', type: 'time' }),
    __metadata("design:type", String)
], ShiftEntity.prototype, "endTime", void 0);
__decorate([
    Column({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], ShiftEntity.prototype, "status", void 0);
__decorate([
    ManyToOne(() => DriverEntityClass, { nullable: true }),
    JoinColumn({ name: 'driver_id' }),
    __metadata("design:type", Function)
], ShiftEntity.prototype, "driver", void 0);
__decorate([
    Column({ name: 'driver_id', nullable: true }),
    __metadata("design:type", String)
], ShiftEntity.prototype, "driverId", void 0);
__decorate([
    Index(),
    Column({ name: 'zone_id', nullable: true }),
    __metadata("design:type", String)
], ShiftEntity.prototype, "zoneId", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], ShiftEntity.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ShiftEntity.prototype, "updatedAt", void 0);
ShiftEntity = __decorate([
    Entity({ name: 'shifts' })
], ShiftEntity);
export { ShiftEntity };
