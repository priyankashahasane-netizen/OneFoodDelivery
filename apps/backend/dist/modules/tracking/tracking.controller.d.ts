import type { Response } from 'express';
import { TrackingService } from './tracking.service.js';
import { TrackPointDto } from './dto/track-point.dto.js';
export declare class TrackingController {
    private readonly trackingService;
    private readonly redisSub;
    private readonly logger;
    constructor(trackingService: TrackingService, redisSub: any);
    sse(orderId: string, res: Response): Promise<void>;
    private isRedisSubAvailable;
    ingest(orderId: string, payload: TrackPointDto, idempotencyKey?: string): Promise<{
        ok: boolean;
        id: any;
        orderId?: undefined;
        driverId?: undefined;
        message?: undefined;
        persisted?: undefined;
    } | {
        ok: boolean;
        id: string;
        orderId: string;
        driverId: string;
        message: string;
        persisted: boolean;
    }>;
}
