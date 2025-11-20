import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DriversModule } from '../drivers/drivers.module.js';
import { RoutePlanEntity } from '../routes/entities/route-plan.entity.js';
import { RoutesModule } from '../routes/routes.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { WalletModule } from '../wallet/wallet.module.js';
import { OrderEntity } from './entities/order.entity.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, RoutePlanEntity]),
    DriversModule,
    forwardRef(() => RoutesModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => WalletModule)
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService]
})
export class OrdersModule {}


