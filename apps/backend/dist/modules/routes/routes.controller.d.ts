import { OptimizeRouteDto } from './dto/optimize-route.dto.js';
import { RoutesService } from './routes.service.js';
export declare class RoutesController {
    private readonly routesService;
    private readonly logger;
    constructor(routesService: RoutesService);
    optimize(payload: OptimizeRouteDto): Promise<import("./entities/route-plan.entity.js").RoutePlanEntity | {
        error: string;
        message: any;
        driverId: string;
        stops: {
            lat: number;
            lng: number;
            orderId?: string;
        }[];
    }>;
    latest(driverId: string): Promise<import("./entities/route-plan.entity.js").RoutePlanEntity>;
}
