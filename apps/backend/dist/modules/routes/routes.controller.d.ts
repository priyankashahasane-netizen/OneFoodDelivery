import { OptimizeRouteDto } from './dto/optimize-route.dto.js';
import { RoutesService } from './routes.service.js';
export declare class RoutesController {
    private readonly routesService;
    constructor(routesService: RoutesService);
    optimize(payload: OptimizeRouteDto): Promise<import("./entities/route-plan.entity.js").RoutePlanEntity>;
    latest(driverId: string): Promise<import("./entities/route-plan.entity.js").RoutePlanEntity>;
}
