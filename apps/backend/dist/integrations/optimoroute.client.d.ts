import { ConfigService } from '@nestjs/config';
interface OptimizeRoutePayload {
    driverId: string;
    stops: Array<{
        lat: number;
        lng: number;
        orderId?: string;
    }>;
}
export declare class OptimoRouteClient {
    private readonly configService;
    private readonly logger;
    private readonly baseUrl;
    private readonly apiKey;
    constructor(configService: ConfigService);
    optimizeRoute(payload: OptimizeRoutePayload): Promise<any>;
    private getMockResponse;
}
export {};
