import type { DriverEntity } from '../../drivers/entities/driver.entity.js';
import type { OrderEntity } from '../../orders/entities/order.entity.js';
export declare class RoutePlanEntity {
    id: string;
    driver: DriverEntity;
    driverId: string;
    order: OrderEntity | null;
    orderId: string | null;
    stops: Array<{
        lat: number;
        lng: number;
        orderId?: string;
        eta?: string;
    }>;
    totalDistanceKm: number;
    etaPerStop: string[] | null;
    rawResponse: Record<string, unknown> | null;
    provider: string;
    createdAt: Date;
    updatedAt: Date;
}
