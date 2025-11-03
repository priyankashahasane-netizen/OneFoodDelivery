var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisClientProvider, RedisSubscriberProvider } from '../../common/redis/redis.provider.js';
import { RoutesModule } from '../routes/routes.module.js';
import { OrderEntity } from '../orders/entities/order.entity.js';
import { TrackingPointEntity } from './entities/tracking-point.entity.js';
import { TrackingController } from './tracking.controller.js';
import { TrackingService } from './tracking.service.js';
let TrackingModule = class TrackingModule {
};
TrackingModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([TrackingPointEntity, OrderEntity]), forwardRef(() => RoutesModule)],
        controllers: [TrackingController],
        providers: [TrackingService, RedisClientProvider, RedisSubscriberProvider]
    })
], TrackingModule);
export { TrackingModule };
