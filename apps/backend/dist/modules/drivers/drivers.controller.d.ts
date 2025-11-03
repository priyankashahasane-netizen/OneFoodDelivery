import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { DriversService } from './drivers.service.js';
import { UpdateDriverDto } from './dto/update-driver.dto.js';
export declare class DriversController {
    private readonly driversService;
    constructor(driversService: DriversService);
    list(pagination: PaginationQueryDto): Promise<{
        items: import("./entities/driver.entity.js").DriverEntity[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getMe(req: any): Promise<import("./dto/driver-profile-response.dto.js").DriverProfileResponseDto>;
    getById(id: string): Promise<import("./entities/driver.entity.js").DriverEntity>;
    update(id: string, payload: UpdateDriverDto, req: any): Promise<import("./entities/driver.entity.js").DriverEntity>;
    updateCapacity(id: string, body: {
        capacity: number;
    }, req: any): Promise<import("./entities/driver.entity.js").DriverEntity>;
    updateOnlineStatus(id: string, body: {
        online: boolean;
    }, req: any): Promise<{
        message: string;
        online: boolean;
        active: number;
    }>;
}
