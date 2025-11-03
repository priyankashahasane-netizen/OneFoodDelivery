import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { OptimizeRouteDto } from './dto/optimize-route.dto.js';
import { RoutesService } from './routes.service.js';

@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  // PRD: POST /api/routes/optimize
  @Post('optimize')
  async optimize(@Body() payload: OptimizeRouteDto) {
    return this.routesService.optimizeForDriver(payload.driverId, payload.stops.map((s) => ({ lat: s.lat, lng: s.lng, orderId: s.orderId })));
  }

  @Get('driver/:driverId/latest')
  async latest(@Param('driverId') driverId: string) {
    return this.routesService.getLatestPlanForDriver(driverId);
  }
}

