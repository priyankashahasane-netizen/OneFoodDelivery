import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Logger } from '@nestjs/common';

import { Public } from '../auth/public.decorator.js';
import { OptimizeRouteDto } from './dto/optimize-route.dto.js';
import { RoutesService } from './routes.service.js';

@Controller('routes')
export class RoutesController {
  private readonly logger = new Logger(RoutesController.name);

  constructor(private readonly routesService: RoutesService) {}

  // PRD: POST /api/routes/optimize
  @Public()
  @Post('optimize')
  async optimize(@Body() payload: OptimizeRouteDto) {
    try {
      const stops = payload.stops.map((s) => ({ lat: s.lat, lng: s.lng, orderId: s.orderId }));
      return await this.routesService.optimizeForDriver(payload.driverId, stops);
    } catch (error: any) {
      this.logger.error(`Failed to optimize route for driver ${payload.driverId}:`, error?.message || error);
      // Return a graceful error response instead of throwing
      return {
        error: 'Failed to optimize route',
        message: error?.message || 'Internal server error',
        driverId: payload.driverId,
        stops: payload.stops
      };
    }
  }

  @Public()
  @Get('driver/:driverId/latest')
  async latest(@Param('driverId') driverId: string) {
    try {
      const plan = await this.routesService.getLatestPlanForDriver(driverId);
      return plan || null;
    } catch (error: any) {
      this.logger.error(`Failed to get latest route for driver ${driverId}:`, error?.message || error);
      // Return null instead of throwing to allow graceful handling
      return null;
    }
  }
}

