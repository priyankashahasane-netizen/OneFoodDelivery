import { Body, Controller, Delete, Get, HttpException, HttpStatus, NotFoundException, Param, Post, Put, Query, Request } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';

import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { AssignOrderDto } from './dto/assign-order.dto.js';
import { OrdersService } from './orders.service.js';
import { UpsertOrderDto } from './dto/upsert-order.dto.js';
import { DriversService } from '../drivers/drivers.service.js';
import { ListOrdersDto } from './dto/list-orders.dto.js';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly driversService: DriversService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'dispatcher', 'support')
  async list(@Query() filters: ListOrdersDto) {
    return this.ordersService.listOrders(filters);
  }

  @Get('driver/:driverId/active')
  @UseGuards(JwtAuthGuard)
  async getActiveByDriver(@Param('driverId') driverId: string, @Request() req: any) {
    try {
      // Prefer path parameter driverId (from Flutter app) over JWT token's driver ID
      // This ensures we use the correct driver ID that the app fetched from profile
      let actualDriverId = driverId;
      
      // If path parameter is 'demo-driver-id' or invalid, try to get real driver ID from token
      if (!actualDriverId || actualDriverId === 'demo-driver-id') {
        actualDriverId = req?.user?.sub || req?.user?.driverId;
      }
      
      // If still no valid driver ID, try to resolve by phone (for demo account)
      if (!actualDriverId || actualDriverId === 'demo-driver-id') {
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
                actualDriverId = driver.id;
                break;
              }
            }
          } catch (e) {
            // If driver lookup fails, continue with what we have
            console.warn('getActiveByDriver: Failed to lookup driver by phone:', e);
          }
        }
      }
      
      if (!actualDriverId) {
        console.warn('getActiveByDriver: No valid driver ID found');
        return []; // Return empty array if no driver ID
      }
      
      console.log(`getActiveByDriver: Fetching active orders for driverId: ${actualDriverId}`);
      const orders = await this.ordersService.getActiveOrdersByDriver(actualDriverId);
      console.log(`getActiveByDriver: Found ${orders.length} active orders`);
      return orders;
    } catch (error) {
      console.error('getActiveByDriver error:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  @Get('available')
  @UseGuards(JwtAuthGuard)
  async getAvailable(@Query() query: { driverId?: string }, @Request() req: any) {
    // Extract driverId from JWT token if not provided in query
    // This allows the endpoint to return orders assigned to the authenticated driver
    let driverId = query.driverId || req?.user?.sub || req?.user?.driverId;
    
    // Handle demo account - resolve to actual driver ID by phone if needed
    if (!driverId || driverId === 'demo-driver-id') {
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
              driverId = driver.id;
              break;
            }
          }
        } catch (e) {
          // If driver lookup fails, continue with what we have
          console.warn('getAvailable: Failed to lookup driver by phone:', e);
        }
      }
    }
    
    return this.ordersService.getAvailableOrders(driverId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'dispatcher', 'support')
  async getById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Get(':id/sla')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'dispatcher', 'support')
  async getSla(@Param('id') id: string) {
    const o = await this.ordersService.findById(id);
    const started = o.assignedAt ?? o.createdAt;
    const due = o.slaSeconds ? new Date(new Date(started).getTime() + o.slaSeconds * 1000) : null;
    const remainingSeconds = due ? Math.max(0, Math.floor((due.getTime() - Date.now()) / 1000)) : null;
    return { dueAt: due?.toISOString() ?? null, remainingSeconds };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'dispatcher')
  async create(@Body() payload: UpsertOrderDto) {
    return this.ordersService.create(payload);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'dispatcher')
  async upsert(@Param('id') id: string, @Body() payload: UpsertOrderDto) {
    return this.ordersService.upsert(id, payload);
  }

  @Put(':id/assign')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'dispatcher')
  async assign(@Param('id') id: string, @Body() payload: AssignOrderDto) {
    return this.ordersService.assignDriver(id, payload.driverId);
  }

  @Put(':id/unassign')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'dispatcher')
  async unassign(@Param('id') id: string) {
    return this.ordersService.unassignDriver(id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }, @Request() req: any) {
    try {
      // Extract driver ID from JWT token for automatic assignment when status is "accepted"
      const driverId = req?.user?.sub || req?.user?.driverId;
      
      const order = await this.ordersService.updateStatus(id, body.status, undefined, driverId);
      return {
        success: true,
        message: `Order status updated to ${body.status}`,
        order: {
          id: order.id,
          status: order.status,
          driverId: order.driverId
        }
      };
    } catch (error: any) {
      console.error(`Error updating order status: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error; // Let NestJS handle 404
      }
      throw new HttpException(
        `Failed to update order status: ${error.message || 'Internal server error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'dispatcher')
  async delete(@Param('id') id: string) {
    return this.ordersService.delete(id);
  }
}

