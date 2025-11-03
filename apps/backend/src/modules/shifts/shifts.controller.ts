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
    if (driverId) {
      return await this.shiftsService.findByDriverId(driverId);
    }
    return await this.shiftsService.findAll();
  }

  @Get('driver/:driverId')
  @UseGuards(JwtAuthGuard)
  async getDriverShifts(@Param('driverId') driverId: string) {
    return await this.shiftsService.findByDriverId(driverId);
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

