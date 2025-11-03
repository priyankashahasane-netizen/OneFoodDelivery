import { NotificationsService } from './notifications.service.js';
export declare class TemplatesController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    list(): Promise<any>;
    update(payload: Record<string, string>): Promise<any>;
}
