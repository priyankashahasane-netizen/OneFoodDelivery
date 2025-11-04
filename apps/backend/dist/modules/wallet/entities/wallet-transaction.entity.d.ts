import type { DriverWalletEntity } from './driver-wallet.entity.js';
import type { OrderEntity } from '../../orders/entities/order.entity.js';
export declare class WalletTransactionEntity {
    id: string;
    wallet: DriverWalletEntity;
    walletId: string;
    order: OrderEntity | null;
    orderId: string | null;
    type: string;
    category: string;
    amount: number;
    description: string | null;
    createdAt: Date;
}
