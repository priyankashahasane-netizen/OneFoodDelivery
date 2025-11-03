var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { RoutesModule } from '../routes/routes.module.js';
import { AssignmentsController } from './assignments.controller.js';
import { AssignmentsService } from './assignments.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from '../../common/audit/audit.entity.js';
import { AuditService } from '../../common/audit/audit.service.js';
let AssignmentsModule = class AssignmentsModule {
};
AssignmentsModule = __decorate([
    Module({
        imports: [OrdersModule, RoutesModule, NotificationsModule, TypeOrmModule.forFeature([AuditLogEntity])],
        controllers: [AssignmentsController],
        providers: [AssignmentsService, AuditService]
    })
], AssignmentsModule);
export { AssignmentsModule };
