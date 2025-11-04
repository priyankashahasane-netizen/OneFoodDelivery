export declare class NotificationEntity {
    id: string;
    event: string;
    orderId: string | null;
    recipients: string[];
    payload: Record<string, unknown> | null;
    sentAt: Date;
}
