var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversModule } from '../drivers/drivers.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { RoutePlanEntity } from './entities/route-plan.entity.js';
import { RoutesController } from './routes.controller.js';
import { RoutesService } from './routes.service.js';
import { OptimoRouteClient } from '../../integrations/optimoroute.client.js';
import { OrdersModule } from '../orders/orders.module.js';
let RoutesModule = class RoutesModule {
};
RoutesModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([RoutePlanEntity]), DriversModule, forwardRef(() => OrdersModule), NotificationsModule],
        controllers: [RoutesController],
        providers: [RoutesService, OptimoRouteClient],
        exports: [RoutesService]
    })
], RoutesModule);
export { RoutesModule };
