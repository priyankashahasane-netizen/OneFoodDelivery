import type { SubscriptionEntity } from './subscription.entity.js';
import type { OrderEntity } from '../../orders/entities/order.entity.js';
export declare class SubscriptionExecutionEntity {
    id: string;
    subscription: SubscriptionEntity;
    subscriptionId: string;
    order: OrderEntity | null;
    orderId: string | null;
    scheduledFor: Date;
    status: string;
    createdAt: Date;
}
