import { Module } from '@nestjs/common';

import { RedisClientProvider } from '../../common/redis/redis.provider.js';
import { NotificationsService } from './notifications.service.js';
import { EventsController } from './events.controller.js';
import { TemplatesController } from './templates.controller.js';

@Module({
  controllers: [EventsController, TemplatesController],
  providers: [NotificationsService, RedisClientProvider],
  exports: [NotificationsService]
})
export class NotificationsModule {}

