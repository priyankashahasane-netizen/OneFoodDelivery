import { Injectable } from '@nestjs/common';

import { OrdersService } from '../orders/orders.service.js';
import { RoutesService } from '../routes/routes.service.js';
import { AssignOrderDto } from './dto/assign-order.dto.js';
import { AuditService } from '../../common/audit/audit.service.js';

@Injectable()
export class AssignmentsService {
  constructor(private readonly ordersService: OrdersService, private readonly routesService: RoutesService, private readonly audit: AuditService) {}

  async assign(payload: AssignOrderDto) {
    const order = await this.ordersService.assignDriver(payload.orderId, payload.driverId);
    await this.audit.log('admin', 'assign_order', { orderId: payload.orderId, driverId: payload.driverId });

    await this.routesService.optimizeForDriver(payload.driverId);

    return {
      status: 'assigned',
      orderId: order.id,
      driverId: payload.driverId,
      trackingUrl: order.trackingUrl
    };
  }
}

