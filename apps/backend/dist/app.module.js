var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration.js';
import { validationSchema } from './config/validation.js';
import { typeOrmDataSource } from './config/typeorm.config.js';
import { AssignmentsModule } from './modules/assignments/assignments.module.js';
import { DriversModule } from './modules/drivers/drivers.module.js';
import { GeoModule } from './modules/geo/geo.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { RoutesModule } from './modules/routes/routes.module.js';
import { TrackingModule } from './modules/tracking/tracking.module.js';
import { HealthController } from './common/health/health.controller.js';
import { ConfigController } from './common/config/config.controller.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { WebhooksModule } from './modules/webhooks/webhooks.module.js';
import { DeliveryManModule } from './modules/delivery-man/delivery-man.module.js';
import { ShiftsModule } from './modules/shifts/shifts.module.js';
import { MetricsService } from './common/metrics/metrics.service.js';
import { MetricsController } from './common/metrics/metrics.controller.js';
import { RedisClientProvider } from './common/redis/redis.provider.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({
                load: [configuration],
                isGlobal: true,
                validationSchema
            }),
            TypeOrmModule.forRootAsync({
                useFactory: () => typeOrmDataSource.options
            }),
            ScheduleModule.forRoot(),
            TerminusModule,
            AuthModule,
            OrdersModule,
            DriversModule,
            AssignmentsModule,
            RoutesModule,
            GeoModule,
            TrackingModule,
            NotificationsModule,
            WebhooksModule,
            DeliveryManModule,
            ShiftsModule
        ],
        controllers: [HealthController, MetricsController, ConfigController],
        providers: [MetricsService, RedisClientProvider]
    })
], AppModule);
export { AppModule };
