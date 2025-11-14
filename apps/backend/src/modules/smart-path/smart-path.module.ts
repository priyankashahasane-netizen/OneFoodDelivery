import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SmartPathEntity } from './entities/smart-path.entity.js';
import { SmartPathController } from './smart-path.controller.js';
import { SmartPathService } from './smart-path.service.js';
import { DriversModule } from '../drivers/drivers.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { RoutesModule } from '../routes/routes.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([SmartPathEntity]),
    DriversModule,
    forwardRef(() => OrdersModule),
    forwardRef(() => RoutesModule)
  ],
  controllers: [SmartPathController],
  providers: [SmartPathService],
  exports: [SmartPathService]
})
export class SmartPathModule {}

