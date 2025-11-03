import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { UpdateDriverDto } from './dto/update-driver.dto.js';
import { DriverEntity } from './entities/driver.entity.js';
import { DriverProfileResponseDto } from './dto/driver-profile-response.dto.js';
export declare class DriversService {
    private readonly driversRepository;
    constructor(driversRepository: Repository<DriverEntity>);
    listDrivers(pagination: PaginationQueryDto): Promise<{
        items: DriverEntity[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findById(driverId: string): Promise<DriverEntity>;
    findByPhone(phone: string): Promise<DriverEntity>;
    getProfile(driverId: string): Promise<DriverProfileResponseDto>;
    update(driverId: string, payload: UpdateDriverDto): Promise<DriverEntity>;
    updatePresence(driverId: string, latitude: number, longitude: number): Promise<DriverEntity>;
}
