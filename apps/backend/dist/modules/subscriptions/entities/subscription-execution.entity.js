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
import { SubscriptionEntity as SubscriptionEntityClass } from './subscription.entity.js';
import { OrderEntity as OrderEntityClass } from '../../orders/entities/order.entity.js';
let SubscriptionExecutionEntity = class SubscriptionExecutionEntity {
    id;
    subscription;
    subscriptionId;
    order;
    orderId;
    scheduledFor;
    status;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], SubscriptionExecutionEntity.prototype, "id", void 0);
__decorate([
    ManyToOne(() => SubscriptionEntityClass, (subscription) => subscription.executions, { nullable: false }),
    JoinColumn({ name: 'subscription_id' }),
    __metadata("design:type", Function)
], SubscriptionExecutionEntity.prototype, "subscription", void 0);
__decorate([
    Index(),
    Column({ name: 'subscription_id' }),
    __metadata("design:type", String)
], SubscriptionExecutionEntity.prototype, "subscriptionId", void 0);
__decorate([
    ManyToOne(() => OrderEntityClass, { nullable: true }),
    JoinColumn({ name: 'order_id' }),
    __metadata("design:type", Function)
], SubscriptionExecutionEntity.prototype, "order", void 0);
__decorate([
    Column({ name: 'order_id', nullable: true }),
    __metadata("design:type", String)
], SubscriptionExecutionEntity.prototype, "orderId", void 0);
__decorate([
    Column({ name: 'scheduled_for', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SubscriptionExecutionEntity.prototype, "scheduledFor", void 0);
__decorate([
    Column({ length: 32, default: 'scheduled' }),
    __metadata("design:type", String)
], SubscriptionExecutionEntity.prototype, "status", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], SubscriptionExecutionEntity.prototype, "createdAt", void 0);
SubscriptionExecutionEntity = __decorate([
    Entity({ name: 'subscription_executions' })
], SubscriptionExecutionEntity);
export { SubscriptionExecutionEntity };
