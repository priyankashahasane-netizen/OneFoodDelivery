import { Body, Controller, Get, Put } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications/templates')
export class TemplatesController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list() {
    return this.notifications.getTemplates();
  }

  @Put()
  async update(@Body() payload: Record<string, string>) {
    return this.notifications.updateTemplates(payload);
  }
}



