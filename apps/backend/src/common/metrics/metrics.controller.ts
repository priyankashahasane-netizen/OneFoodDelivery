import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service.js';
import { Roles } from '../../modules/auth/roles.decorator.js';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Roles('admin', 'support')
  get() {
    return this.metrics.getAll();
  }
}



