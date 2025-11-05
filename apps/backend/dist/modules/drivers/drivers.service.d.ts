import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { UpdateDriverDto } from './dto/update-driver.dto.js';
import { DriverEntity } from './entities/driver.entity.js';
import { DriverProfileResponseDto } from './dto/driver-profile-response.dto.js';
import { DriverBankAccountEntity } from './entities/driver-bank-account.entity.js';
export declare class DriversService {
    private readonly driversRepository;
    private readonly bankAccountRepository;
    constructor(driversRepository: Repository<DriverEntity>, bankAccountRepository: Repository<DriverBankAccountEntity>);
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
    updateMetadata(driverId: string, metadata: Record<string, unknown>): Promise<DriverEntity>;
    getBankAccountsByDriverId(driverId: string): Promise<DriverBankAccountEntity[]>;
    getBankAccountsForWithdrawMethods(driverId: string): Promise<{
        id: number;
        method_name: string;
        method_fields: {
            input_type: string;
            input_name: string;
            placeholder: string;
            is_required: number;
            value: string;
        }[];
        is_default: number;
        is_active: number;
        created_at: string;
        updated_at: string;
    }[]>;
}
