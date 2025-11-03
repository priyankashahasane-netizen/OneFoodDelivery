import { Body, Controller, Post } from '@nestjs/common';

import { NotificationsService } from './notifications.service.js';

@Controller('events')
export class EventsController {
  constructor(private readonly notifications: NotificationsService) {}

  // PRD: POST /api/events/delivery-completed
  @Post('delivery-completed')
  async deliveryCompleted(
    @Body()
    payload: { orderId: string; driverId: string; pod?: { photoUrl?: string; signature?: string }; ts?: string }
  ) {
    await this.notifications.broadcastDeliveryCompleted(payload.orderId);
    return { ok: true };
  }
}


