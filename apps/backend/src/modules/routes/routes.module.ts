import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DriversModule } from '../drivers/drivers.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { RoutePlanEntity } from './entities/route-plan.entity.js';
import { RoutesController } from './routes.controller.js';
import { RoutesService } from './routes.service.js';
import { OptimoRouteClient } from '../../integrations/optimoroute.client.js';
import { OrdersModule } from '../orders/orders.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([RoutePlanEntity]), DriversModule, forwardRef(() => OrdersModule), NotificationsModule],
  controllers: [RoutesController],
  providers: [RoutesService, OptimoRouteClient],
  exports: [RoutesService]
})
export class RoutesModule {}

