import { WebhooksService } from './webhooks.service.js';
import { CreateOrderFromWebhookDto } from './dto/create-order-webhook.dto.js';
export declare class WebhooksController {
    private readonly webhooksService;
    private readonly logger;
    constructor(webhooksService: WebhooksService);
    handleOrderWebhook(dto: CreateOrderFromWebhookDto, signature?: string, platformKey?: string): Promise<{
        success: boolean;
        orderId: string;
        trackingUrl: string;
        status: string;
        message: string;
    }>;
    testWebhook(): Promise<{
        success: boolean;
        orderId: string;
        trackingUrl: string;
        status: string;
        message: string;
    }>;
}
