import { Repository } from 'typeorm';
import { OrderEntity } from '../orders/entities/order.entity.js';
import { CreateOrderFromWebhookDto } from './dto/create-order-webhook.dto.js';
export declare class WebhooksService {
    private readonly orderRepository;
    private readonly logger;
    constructor(orderRepository: Repository<OrderEntity>);
    processOrderWebhook(dto: CreateOrderFromWebhookDto): Promise<OrderEntity>;
    verifySignature(platform: string, signature: string, payload: any): boolean;
}
