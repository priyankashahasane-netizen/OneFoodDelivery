import { OrdersService } from '../orders/orders.service.js';
import { RoutesService } from '../routes/routes.service.js';
import { AssignOrderDto } from './dto/assign-order.dto.js';
import { AuditService } from '../../common/audit/audit.service.js';
export declare class AssignmentsService {
    private readonly ordersService;
    private readonly routesService;
    private readonly audit;
    constructor(ordersService: OrdersService, routesService: RoutesService, audit: AuditService);
    assign(payload: AssignOrderDto): Promise<{
        status: string;
        orderId: string;
        driverId: string;
        trackingUrl: string;
    }>;
}
