import type { DriverEntity } from '../../drivers/entities/driver.entity.js';
import type { DriverBankAccountEntity } from '../../drivers/entities/driver-bank-account.entity.js';
export declare class WithdrawalRequestEntity {
    id: string;
    driver: DriverEntity;
    driverId: string;
    bankAccount: DriverBankAccountEntity | null;
    bankAccountId: string | null;
    amount: number;
    status: string;
    requestedAt: Date;
    processedAt: Date | null;
    txnRef: string | null;
    remarks: string | null;
}
