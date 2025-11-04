import type { DriverEntity } from '../../drivers/entities/driver.entity.js';
import type { OrderEntity } from './order.entity.js';
export declare class ProofOfDeliveryEntity {
    id: string;
    order: OrderEntity;
    orderId: string;
    driver: DriverEntity | null;
    driverId: string | null;
    photoUrl: string;
    signatureUrl: string | null;
    notes: string | null;
    otpCode: string | null;
    createdAt: Date;
}
