import type { RoutePlanEntity } from '../../routes/entities/route-plan.entity.js';
import type { TrackingPointEntity } from '../../tracking/entities/tracking-point.entity.js';
export declare class DriverEntity {
    id: string;
    name: string;
    phone: string;
    vehicleType: string;
    capacity: number;
    online: boolean;
    latitude: number | null;
    longitude: number | null;
    lastSeenAt: Date | null;
    ipAddress: string | null;
    metadata: Record<string, unknown> | null;
    routePlans: RoutePlanEntity[];
    trackingPoints: TrackingPointEntity[];
    createdAt: Date;
    updatedAt: Date;
    zoneId: string | null;
}
