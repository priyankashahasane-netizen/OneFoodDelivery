import type { DriverEntity } from './driver.entity.js';
import type { WithdrawalRequestEntity } from '../../wallet/entities/withdrawal-request.entity.js';
export declare class DriverBankAccountEntity {
    id: string;
    driver: DriverEntity;
    driverId: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string | null;
    upiId: string | null;
    isVerified: boolean;
    withdrawalRequests: WithdrawalRequestEntity[];
    createdAt: Date;
    updatedAt: Date;
}
