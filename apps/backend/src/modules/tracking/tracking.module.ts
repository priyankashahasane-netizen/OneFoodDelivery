import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RedisClientProvider, RedisSubscriberProvider } from '../../common/redis/redis.provider.js';
import { RoutesModule } from '../routes/routes.module.js';
import { OrderEntity } from '../orders/entities/order.entity.js';
import { TrackingPointEntity } from './entities/tracking-point.entity.js';
import { TrackingController } from './tracking.controller.js';
import { TrackingService } from './tracking.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([TrackingPointEntity, OrderEntity]), forwardRef(() => RoutesModule)],
  controllers: [TrackingController],
  providers: [TrackingService, RedisClientProvider, RedisSubscriberProvider]
})
export class TrackingModule {}

