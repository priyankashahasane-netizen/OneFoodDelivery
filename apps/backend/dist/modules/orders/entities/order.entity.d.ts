import type { DriverEntity } from '../../drivers/entities/driver.entity.js';
import type { RoutePlanEntity } from '../../routes/entities/route-plan.entity.js';
import type { TrackingPointEntity } from '../../tracking/entities/tracking-point.entity.js';
export declare class OrderEntity {
    id: string;
    externalRef: string | null;
    pickup: {
        lat: number;
        lng: number;
        address?: string;
    };
    dropoff: {
        lat: number;
        lng: number;
        address?: string;
    };
    status: string;
    items: unknown[] | null;
    paymentType: string;
    slaSeconds: number;
    trackingUrl: string | null;
    assignedAt: Date | null;
    driver: DriverEntity | null;
    driverId: string | null;
    trackingPoints: TrackingPointEntity[];
    routePlans: RoutePlanEntity[];
    zoneId: string | null;
    subscriptionId: string | null;
    cancellationSource: string | null;
    cancellationReason: string | null;
    deliveredAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
