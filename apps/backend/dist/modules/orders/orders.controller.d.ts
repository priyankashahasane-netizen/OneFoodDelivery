import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { AssignOrderDto } from '../assignments/dto/assign-order.dto.js';
import { OrdersService } from './orders.service.js';
import { UpsertOrderDto } from './dto/upsert-order.dto.js';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    list(pagination: PaginationQueryDto): Promise<{
        items: import("./entities/order.entity.js").OrderEntity[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getActiveByDriver(driverId: string, req: any): Promise<import("./entities/order.entity.js").OrderEntity[]>;
    getAvailable(query: {
        driverId?: string;
    }): Promise<import("./entities/order.entity.js").OrderEntity[]>;
    getById(id: string): Promise<import("./entities/order.entity.js").OrderEntity>;
    getSla(id: string): Promise<{
        dueAt: string;
        remainingSeconds: number;
    }>;
    upsert(id: string, payload: UpsertOrderDto): Promise<import("./entities/order.entity.js").OrderEntity>;
    assign(id: string, payload: AssignOrderDto): Promise<import("./entities/order.entity.js").OrderEntity>;
    updateStatus(id: string, body: {
        status: string;
    }, req: any): Promise<import("./entities/order.entity.js").OrderEntity>;
}
