import { AssignmentsService } from './assignments.service.js';
import { AssignOrderDto } from './dto/assign-order.dto.js';
export declare class AssignmentsController {
    private readonly assignmentsService;
    constructor(assignmentsService: AssignmentsService);
    assign(payload: AssignOrderDto, req: any): Promise<{
        status: string;
        orderId: string;
        driverId: string;
        trackingUrl: string;
    }>;
}
