import { Repository } from 'typeorm';
import { ShiftEntity } from './entities/shift.entity.js';
export declare class ShiftsService {
    private readonly shiftRepository;
    constructor(shiftRepository: Repository<ShiftEntity>);
    findAll(): Promise<ShiftEntity[]>;
    findByDriverId(driverId: string): Promise<ShiftEntity[]>;
    private isValidUUID;
    findByZoneId(zoneId: string): Promise<ShiftEntity[]>;
    findById(id: string): Promise<ShiftEntity>;
    create(shiftData: Partial<ShiftEntity>): Promise<ShiftEntity>;
    update(id: string, shiftData: Partial<ShiftEntity>): Promise<ShiftEntity>;
    delete(id: string): Promise<void>;
}
