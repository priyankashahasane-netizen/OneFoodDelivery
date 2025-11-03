import { Repository } from 'typeorm';
import type { RoutesService } from '../routes/routes.service.js';
import { TrackingPointEntity } from './entities/tracking-point.entity.js';
export declare class TrackingService {
    private readonly trackingRepository;
    private readonly redis;
    private readonly routesService;
    constructor(trackingRepository: Repository<TrackingPointEntity>, redis: any, routesService: RoutesService);
    listRecent(orderId: string, limit?: number): Promise<TrackingPointEntity[]>;
    record(orderId: string, payload: {
        driverId: string;
        lat: number;
        lng: number;
        speed?: number;
        heading?: number;
        ts?: string;
    }, idempotencyKey?: string): Promise<any>;
    private isRedisAvailable;
}
