import type { DriverEntity } from '../../drivers/entities/driver.entity.js';
import type { OrderEntity } from '../../orders/entities/order.entity.js';
export declare class TrackingPointEntity {
    id: string;
    order: OrderEntity;
    orderId: string;
    driver: DriverEntity;
    driverId: string;
    latitude: number;
    longitude: number;
    speed: number | null;
    heading: number | null;
    recordedAt: Date;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    ingestSequence: string;
}
