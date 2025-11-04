import type { DriverEntity } from '../../drivers/entities/driver.entity.js';
import type { OrderEntity } from '../../orders/entities/order.entity.js';
export declare class RoutePlanEntity {
    id: string;
    driver: DriverEntity | null;
    driverId: string | null;
    order: OrderEntity | null;
    orderId: string | null;
    status: string;
    stops: Array<{
        lat: number;
        lng: number;
        orderId?: string;
        eta?: string;
        id?: string;
        address?: string;
        serviceTimeSec?: number;
        sequencePosition?: number;
    }>;
    sequence: number[] | null;
    polyline: string | null;
    totalDistanceKm: number;
    estimatedDurationSec: number | null;
    etaPerStop: string[] | null;
    assignedAt: Date | null;
    completedAt: Date | null;
    meta: Record<string, unknown> | null;
    rawResponse: Record<string, unknown> | null;
    provider: string;
    createdAt: Date;
    updatedAt: Date;
}
