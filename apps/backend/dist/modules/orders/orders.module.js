var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversModule } from '../drivers/drivers.module.js';
import { RoutePlanEntity } from '../routes/entities/route-plan.entity.js';
import { RoutesModule } from '../routes/routes.module.js';
import { OrderEntity } from './entities/order.entity.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
let OrdersModule = class OrdersModule {
};
OrdersModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([OrderEntity, RoutePlanEntity]), DriversModule, forwardRef(() => RoutesModule)],
        providers: [OrdersService],
        controllers: [OrdersController],
        exports: [OrdersService]
    })
], OrdersModule);
export { OrdersModule };
