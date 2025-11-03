import { ShiftsService } from './shifts.service.js';
import { ShiftEntity } from './entities/shift.entity.js';
export declare class ShiftsController {
    private readonly shiftsService;
    constructor(shiftsService: ShiftsService);
    getAllShifts(req: any): Promise<ShiftEntity[]>;
    getDriverShifts(driverId: string): Promise<ShiftEntity[]>;
    getShift(id: string): Promise<ShiftEntity>;
    createShift(shiftData: Partial<ShiftEntity>): Promise<ShiftEntity>;
    updateShift(id: string, shiftData: Partial<ShiftEntity>): Promise<ShiftEntity>;
    deleteShift(id: string): Promise<{
        message: string;
    }>;
}
