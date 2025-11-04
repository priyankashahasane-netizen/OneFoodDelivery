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
import { SubscriptionExecutionEntity as SubscriptionExecutionEntityClass } from './subscription-execution.entity.js';
let SubscriptionEntity = class SubscriptionEntity {
    id;
    orderTemplateId;
    driver;
    driverId;
    routePlan;
    routePlanId;
    frequency;
    daysOfWeek;
    startDate;
    endDate;
    nextDeliveryAt;
    active;
    executions;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], SubscriptionEntity.prototype, "id", void 0);
__decorate([
    Column({ name: 'order_template_id', length: 255 }),
    __metadata("design:type", String)
], SubscriptionEntity.prototype, "orderTemplateId", void 0);
__decorate([
    ManyToOne(() => DriverEntityClass, { nullable: true }),
    JoinColumn({ name: 'driver_id' }),
    __metadata("design:type", Function)
], SubscriptionEntity.prototype, "driver", void 0);
__decorate([
    Index(),
    Column({ name: 'driver_id', nullable: true }),
    __metadata("design:type", String)
], SubscriptionEntity.prototype, "driverId", void 0);
__decorate([
    ManyToOne(() => RoutePlanEntityClass, { nullable: true }),
    JoinColumn({ name: 'route_plan_id' }),
    __metadata("design:type", Function)
], SubscriptionEntity.prototype, "routePlan", void 0);
__decorate([
    Column({ name: 'route_plan_id', nullable: true }),
    __metadata("design:type", String)
], SubscriptionEntity.prototype, "routePlanId", void 0);
__decorate([
    Column({ length: 32 }),
    __metadata("design:type", String)
], SubscriptionEntity.prototype, "frequency", void 0);
__decorate([
    Column({ name: 'days_of_week', type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], SubscriptionEntity.prototype, "daysOfWeek", void 0);
__decorate([
    Column({ name: 'start_date', type: 'date' }),
    __metadata("design:type", Date)
], SubscriptionEntity.prototype, "startDate", void 0);
__decorate([
    Column({ name: 'end_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], SubscriptionEntity.prototype, "endDate", void 0);
__decorate([
    Column({ name: 'next_delivery_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], SubscriptionEntity.prototype, "nextDeliveryAt", void 0);
__decorate([
    Column({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], SubscriptionEntity.prototype, "active", void 0);
__decorate([
    OneToMany(() => SubscriptionExecutionEntityClass, (execution) => execution.subscription),
    __metadata("design:type", Array)
], SubscriptionEntity.prototype, "executions", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], SubscriptionEntity.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ name: 'updated_at' }),
    __metadata("design:type", Date)
], SubscriptionEntity.prototype, "updatedAt", void 0);
SubscriptionEntity = __decorate([
    Entity({ name: 'subscriptions' })
], SubscriptionEntity);
export { SubscriptionEntity };
