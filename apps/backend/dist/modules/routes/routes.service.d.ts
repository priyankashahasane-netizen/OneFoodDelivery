import { Repository } from 'typeorm';
import { DriversService } from '../drivers/drivers.service.js';
import type { OrdersService } from '../orders/orders.service.js';
import { RoutePlanEntity } from './entities/route-plan.entity.js';
import { OptimoRouteClient } from '../../integrations/optimoroute.client.js';
export declare class RoutesService {
    private readonly routePlansRepository;
    private readonly driversService;
    private readonly optimoRouteClient;
    private readonly ordersService;
    constructor(routePlansRepository: Repository<RoutePlanEntity>, driversService: DriversService, optimoRouteClient: OptimoRouteClient, ordersService: OrdersService);
    enqueueOptimizationForDriver(driverId: string): Promise<RoutePlanEntity>;
    optimizeForDriver(driverId: string, stopsOverride?: Array<{
        lat: number;
        lng: number;
        orderId?: string;
    }>): Promise<RoutePlanEntity>;
    getLatestPlanForDriver(driverId: string): Promise<RoutePlanEntity>;
}
