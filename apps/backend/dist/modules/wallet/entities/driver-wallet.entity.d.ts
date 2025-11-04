import type { DriverEntity } from '../../drivers/entities/driver.entity.js';
import type { WalletTransactionEntity } from './wallet-transaction.entity.js';
export declare class DriverWalletEntity {
    id: string;
    driver: DriverEntity;
    driverId: string;
    balance: number;
    currency: string;
    transactions: WalletTransactionEntity[];
    updatedAt: Date;
}
