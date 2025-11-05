import { Repository } from 'typeorm';
import { DriverWalletEntity } from './entities/driver-wallet.entity.js';
import { WalletTransactionEntity } from './entities/wallet-transaction.entity.js';
import { DriversService } from '../drivers/drivers.service.js';
export declare class WalletService {
    private readonly walletRepository;
    private readonly transactionRepository;
    private readonly driversService;
    constructor(walletRepository: Repository<DriverWalletEntity>, transactionRepository: Repository<WalletTransactionEntity>, driversService: DriversService);
    getWalletByDriverId(driverId: string): Promise<DriverWalletEntity | null>;
    getWalletTransactions(driverId: string, limit?: number, offset?: number): Promise<{
        transactions: {
            id: number;
            from_type: string;
            from_id: number;
            current_balance: number;
            amount: number;
            method: string;
            ref: string;
            created_at: string;
            updated_at: string;
            type: string;
            created_by: string;
            payment_method: string;
            status: string;
            payment_time: string;
        }[];
        total_size: number;
        limit: number;
        offset: number;
    }>;
    adjustWalletToZero(driverId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getBankDetails(driverId: string): Promise<{
        bank_details: {
            id: number;
            method_name: string;
            method_fields: {
                input_type: string;
                input_name: string;
                placeholder: string;
                is_required: number;
                value: string;
            }[];
            is_default: number;
            is_active: number;
            created_at: string;
            updated_at: string;
        }[];
        total_size: number;
    }>;
}
