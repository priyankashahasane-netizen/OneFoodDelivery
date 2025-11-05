import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { ShiftsService } from './shifts.service.js';
import { ShiftEntity } from './entities/shift.entity.js';

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllShifts(@Request() req: any) {
    const driverId = req?.user?.sub || req?.user?.driverId;
    // Handle demo-driver-id: return all shifts instead of querying with invalid UUID
    if (driverId && driverId !== 'demo-driver-id') {
      try {
        return await this.shiftsService.findByDriverId(driverId);
      } catch (error) {
        // If driverId is not a valid UUID, fall back to all shifts
        return await this.shiftsService.findAll();
      }
    }
    // Return all shifts for demo account or when no driverId
    return await this.shiftsService.findAll();
  }

  @Get('driver/:driverId')
  @UseGuards(JwtAuthGuard)
  async getDriverShifts(@Param('driverId') driverId: string) {
    // Handle demo-driver-id: return all shifts instead of querying with invalid UUID
    if (driverId === 'demo-driver-id') {
      return await this.shiftsService.findAll();
    }
    try {
      return await this.shiftsService.findByDriverId(driverId);
    } catch (error) {
      // If driverId is not a valid UUID, return all shifts as fallback
      return await this.shiftsService.findAll();
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getShift(@Param('id') id: string) {
    return await this.shiftsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createShift(@Body() shiftData: Partial<ShiftEntity>) {
    return await this.shiftsService.create(shiftData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateShift(@Param('id') id: string, @Body() shiftData: Partial<ShiftEntity>) {
    return await this.shiftsService.update(id, shiftData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteShift(@Param('id') id: string) {
    await this.shiftsService.delete(id);
    return { message: 'Shift deleted successfully' };
  }
}

