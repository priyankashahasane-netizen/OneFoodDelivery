import { NotificationsService } from './notifications.service.js';
export declare class EventsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    deliveryCompleted(payload: {
        orderId: string;
        driverId: string;
        pod?: {
            photoUrl?: string;
            signature?: string;
        };
        ts?: string;
    }): Promise<{
        ok: boolean;
    }>;
}
