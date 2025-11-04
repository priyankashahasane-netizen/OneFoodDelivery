var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
let NotificationEntity = class NotificationEntity {
    id;
    event;
    orderId;
    recipients;
    payload;
    sentAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], NotificationEntity.prototype, "id", void 0);
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], NotificationEntity.prototype, "event", void 0);
__decorate([
    Index(),
    Column({ name: 'order_id', nullable: true }),
    __metadata("design:type", String)
], NotificationEntity.prototype, "orderId", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Array)
], NotificationEntity.prototype, "recipients", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], NotificationEntity.prototype, "payload", void 0);
__decorate([
    CreateDateColumn({ name: 'sent_at' }),
    __metadata("design:type", Date)
], NotificationEntity.prototype, "sentAt", void 0);
NotificationEntity = __decorate([
    Entity({ name: 'notifications' })
], NotificationEntity);
export { NotificationEntity };
