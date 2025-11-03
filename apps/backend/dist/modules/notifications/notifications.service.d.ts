export declare class NotificationsService {
    private readonly redis;
    private readonly logger;
    constructor(redis: any);
    broadcastAssignment(orderId: string, driverId: string): Promise<void>;
    broadcastDeliveryCompleted(orderId: string): Promise<void>;
    getTemplates(): Promise<any>;
    updateTemplates(payload: Record<string, string>): Promise<any>;
    private renderTemplate;
    private isRedisAvailable;
    private defaultTemplate;
}
