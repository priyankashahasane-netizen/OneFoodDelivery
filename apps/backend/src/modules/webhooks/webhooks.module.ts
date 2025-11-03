import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';
import { OrderEntity } from '../orders/entities/order.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity])],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
