import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Logger } from '@nestjs/common';

import { Public } from '../auth/public.decorator.js';
import { SmartPathService } from './smart-path.service.js';
import { GenerateSmartPathDto } from './dto/generate-smart-path.dto.js';
import { SmartPathResponseDto } from './dto/smart-path-response.dto.js';

@Controller('smart-path')
export class SmartPathController {
  private readonly logger = new Logger(SmartPathController.name);

  constructor(private readonly smartPathService: SmartPathService) {}

  @Public()
  @Post('generate')
  async generate(@Body() payload: GenerateSmartPathDto) {
    try {
      const date = payload.date ? new Date(payload.date) : undefined;
      const smartPaths = await this.smartPathService.generateSmartPath(payload.driverId, date);
      
      return smartPaths.map(sp => this.toResponseDto(sp));
    } catch (error: any) {
      this.logger.error(`Failed to generate Smart Path for driver ${payload.driverId}:`, error?.message || error);
      return {
        error: 'Failed to generate Smart Path',
        message: error?.message || 'Internal server error',
        driverId: payload.driverId
      };
    }
  }

  @Public()
  @Get('driver/:driverId')
  async getForDriver(
    @Param('driverId') driverId: string,
    @Query('date') date?: string
  ) {
    try {
      const targetDate = date ? new Date(date) : undefined;
      const smartPaths = await this.smartPathService.getSmartPathForDriver(driverId, targetDate);
      return smartPaths.map(sp => this.toResponseDto(sp));
    } catch (error: any) {
      this.logger.error(`Failed to get Smart Path for driver ${driverId}:`, error?.message || error);
      return [];
    }
  }

  @Public()
  @Get(':id')
  async getById(@Param('id') id: string) {
    try {
      const smartPath = await this.smartPathService.getSmartPathById(id);
      return this.toResponseDto(smartPath);
    } catch (error: any) {
      this.logger.error(`Failed to get Smart Path ${id}:`, error?.message || error);
      return {
        error: 'Smart Path not found',
        message: error?.message || 'Internal server error'
      };
    }
  }

  private toResponseDto(smartPath: any): SmartPathResponseDto {
    return {
      id: smartPath.id,
      driverId: smartPath.driverId,
      pickupLocation: smartPath.pickupLocation,
      orderIds: smartPath.orderIds,
      routePlanId: smartPath.routePlanId,
      status: smartPath.status,
      targetDate: smartPath.targetDate,
      routePlan: smartPath.routePlan ? {
        id: smartPath.routePlan.id,
        stops: smartPath.routePlan.stops,
        sequence: smartPath.routePlan.sequence,
        polyline: smartPath.routePlan.polyline,
        totalDistanceKm: smartPath.routePlan.totalDistanceKm,
        estimatedDurationSec: smartPath.routePlan.estimatedDurationSec,
        etaPerStop: smartPath.routePlan.etaPerStop
      } : null,
      createdAt: smartPath.createdAt,
      updatedAt: smartPath.updatedAt
    };
  }
}

