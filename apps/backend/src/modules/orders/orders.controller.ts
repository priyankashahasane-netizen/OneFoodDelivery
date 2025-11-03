import { Body, Controller, Get, Param, Put, Query, Request } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';

import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { AssignOrderDto } from '../assignments/dto/assign-order.dto.js';
import { OrdersService } from './orders.service.js';
import { UpsertOrderDto } from './dto/upsert-order.dto.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles('admin', 'dispatcher', 'support')
  async list(@Query() pagination: PaginationQueryDto) {
    return this.ordersService.listOrders(pagination);
  }

  @Get('driver/:driverId/active')
  @UseGuards(JwtAuthGuard)
  async getActiveByDriver(@Param('driverId') driverId: string, @Request() req: any) {
    try {
      // Use JWT token's driver ID instead of path parameter to avoid UUID/numeric ID mismatch
      const actualDriverId = req?.user?.sub || req?.user?.driverId || driverId;
      if (!actualDriverId) {
        return []; // Return empty array if no driver ID
      }
      return await this.ordersService.getActiveOrdersByDriver(actualDriverId);
    } catch (error) {
      // Return empty array on error instead of throwing
      return [];
    }
  }

  @Get('available')
  @UseGuards(JwtAuthGuard)
  async getAvailable(@Query() query: { driverId?: string }) {
    return this.ordersService.getAvailableOrders(query.driverId);
  }

  @Get(':id')
  @Roles('admin', 'dispatcher', 'support')
  async getById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Get(':id/sla')
  @Roles('admin', 'dispatcher', 'support')
  async getSla(@Param('id') id: string) {
    const o = await this.ordersService.findById(id);
    const started = o.assignedAt ?? o.createdAt;
    const due = o.slaSeconds ? new Date(new Date(started).getTime() + o.slaSeconds * 1000) : null;
    const remainingSeconds = due ? Math.max(0, Math.floor((due.getTime() - Date.now()) / 1000)) : null;
    return { dueAt: due?.toISOString() ?? null, remainingSeconds };
  }

  @Put(':id')
  @Roles('admin', 'dispatcher')
  async upsert(@Param('id') id: string, @Body() payload: UpsertOrderDto) {
    return this.ordersService.upsert(id, payload);
  }

  @Put(':id/assign')
  @Roles('admin', 'dispatcher')
  async assign(@Param('id') id: string, @Body() payload: AssignOrderDto) {
    return this.ordersService.assignDriver(id, payload.driverId);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }, @Request() req: any) {
    return this.ordersService.updateStatus(id, body.status);
  }
}

