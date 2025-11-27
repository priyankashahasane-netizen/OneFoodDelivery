import { BadRequestException, Body, Controller, Post, Request } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';

import { AssignmentsService } from './assignments.service.js';
import { AssignOrderDto } from './dto/assign-order.dto.js';
import { DriversService } from '../drivers/drivers.service.js';

@Controller('assignments')
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly driversService: DriversService
  ) {}

  @Post('assign')
  @UseGuards(JwtAuthGuard)
  async assign(@Body() payload: AssignOrderDto, @Request() req: any) {
    // If driverId not provided, use authenticated driver from JWT token
    if (!payload.driverId) {
      payload.driverId = req.user?.sub || req.user?.driverId;
    }
    
    // Handle demo account - resolve to actual driver ID by phone if needed
    if (!payload.driverId || payload.driverId === 'demo-driver-id') {
      const phone = req?.user?.phone;
      if (phone) {
        try {
          // Try to find driver by phone (check multiple phone format variations)
          const phoneVariations = [
            phone,
            phone.replace('+91', '').replace(/-/g, ''),
            phone.replace('+', ''),
            `+91${phone.replace('+91', '').replace(/-/g, '')}`,
            `91${phone.replace('+91', '').replace(/-/g, '')}`
          ];
          
          for (const phoneVar of phoneVariations) {
            const driver = await this.driversService.findByPhone(phoneVar);
            if (driver) {
              payload.driverId = driver.id;
              break;
            }
          }
        } catch (e) {
          // If driver lookup fails, continue with what we have
          console.warn('assign: Failed to lookup driver by phone:', e);
        }
      }
    }
    
    // Ensure driverId is set and is not 'demo-driver-id'
    if (!payload.driverId || payload.driverId === 'demo-driver-id') {
      throw new BadRequestException('Driver ID is required. Please ensure you are authenticated with a valid driver account.');
    }
    
    return this.assignmentsService.assign(payload);
  }
}

