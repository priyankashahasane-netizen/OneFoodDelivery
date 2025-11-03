import type { DriverEntity } from '../../drivers/entities/driver.entity.js';
export declare class ShiftEntity {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    status: number;
    driver: DriverEntity | null;
    driverId: string | null;
    zoneId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
