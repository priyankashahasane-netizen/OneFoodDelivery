import { Body, Controller, Post, Request } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';

import { AssignmentsService } from './assignments.service.js';
import { AssignOrderDto } from './dto/assign-order.dto.js';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post('assign')
  @UseGuards(JwtAuthGuard)
  async assign(@Body() payload: AssignOrderDto, @Request() req: any) {
    // If driverId not provided, use authenticated driver
    if (!payload.driverId) {
      payload.driverId = req.user?.sub || req.user?.driverId;
    }
    return this.assignmentsService.assign(payload);
  }
}

