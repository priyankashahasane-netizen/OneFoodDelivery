import { Module, forwardRef } from '@nestjs/common';

import { RedisClientProvider } from '../../common/redis/redis.provider.js';
import { DriversModule } from '../drivers/drivers.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { NotificationsService } from './notifications.service.js';
import { FcmService } from './fcm.service.js';
import { EventsController } from './events.controller.js';
import { TemplatesController } from './templates.controller.js';

@Module({
  imports: [forwardRef(() => DriversModule), forwardRef(() => OrdersModule)],
  controllers: [EventsController, TemplatesController],
  providers: [NotificationsService, FcmService, RedisClientProvider],
  exports: [NotificationsService, FcmService]
})
export class NotificationsModule {}

