import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverWalletEntity } from './entities/driver-wallet.entity.js';
import { WalletTransactionEntity } from './entities/wallet-transaction.entity.js';
import { DriversService } from '../drivers/drivers.service.js';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(DriverWalletEntity)
    private readonly walletRepository: Repository<DriverWalletEntity>,
    @InjectRepository(WalletTransactionEntity)
    private readonly transactionRepository: Repository<WalletTransactionEntity>,
    private readonly driversService: DriversService
  ) {}

  async getWalletByDriverId(driverId: string): Promise<DriverWalletEntity | null> {
    return await this.walletRepository.findOne({
      where: { driverId },
      relations: ['transactions']
    });
  }

  async getWalletTransactions(
    driverId: string,
    limit: number = 25,
    offset: number = 0
  ) {
    const wallet = await this.getWalletByDriverId(driverId);
    
    if (!wallet) {
      return {
        transactions: [],
        total_size: 0,
        limit,
        offset
      };
    }

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['order']
    });

    // Map transactions to Flutter-expected format
    const mappedTransactions = transactions.map((txn, index) => {
      // Calculate running balance (assuming transactions are sorted by date DESC)
      // For simplicity, we'll use the wallet balance as current balance
      // In a real scenario, you'd calculate this based on transaction history
      const currentBalance = parseFloat(wallet.balance.toString());
      
      // Map category to method
      const categoryToMethod: Record<string, string> = {
        'delivery_fee': 'delivery_fee',
        'bonus': 'bonus',
        'penalty': 'penalty',
        'withdrawal': 'withdrawal',
        'cash_on_delivery': 'cash',
        'payment': 'payment'
      };
      
      const method = categoryToMethod[txn.category] || txn.category || 'payment';
      
      // Try to parse orderId as integer, but if it's a UUID, use a hash instead
      let fromId: number | null = null;
      if (txn.orderId) {
        // If orderId is numeric, parse it; otherwise extract numeric parts from UUID
        const parsed = parseInt(txn.orderId, 10);
        if (!isNaN(parsed)) {
          fromId = parsed;
        } else {
          // Extract numeric parts from UUID (first segment) and convert to number
          const numericPart = txn.orderId.split('-')[0].replace(/\D/g, '');
          fromId = numericPart ? parseInt(numericPart.substring(0, 8), 16) || index + 1 : index + 1;
        }
      }
      
      return {
        id: index + 1 + offset, // Sequential ID for Flutter compatibility
        from_type: txn.orderId ? 'order' : 'wallet',
        from_id: fromId,
        current_balance: currentBalance,
        amount: parseFloat(txn.amount.toString()),
        method: method,
        ref: txn.id.substring(0, 8).toUpperCase(), // Use first 8 chars of UUID as ref
        created_at: txn.createdAt.toISOString(),
        updated_at: txn.createdAt.toISOString(), // Use createdAt as updatedAt
        type: txn.type, // 'credit' or 'debit'
        created_by: 'system',
        payment_method: method,
        status: 'completed',
        payment_time: txn.createdAt.toISOString().replace('T', ' ').substring(0, 19)
      };
    });

    return {
      transactions: mappedTransactions,
      total_size: total,
      limit,
      offset
    };
  }

  async adjustWalletToZero(driverId: string): Promise<{ success: boolean; message: string }> {
    const wallet = await this.getWalletByDriverId(driverId);
    
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for driver ${driverId}`);
    }

    // Ensure wallet has an ID
    if (!wallet.id) {
      throw new NotFoundException(`Wallet ID not found for driver ${driverId}`);
    }

    const currentBalance = parseFloat(wallet.balance.toString());
    
    // If balance is already zero, return success
    if (currentBalance === 0) {
      return {
        success: true,
        message: 'Wallet balance is already zero'
      };
    }

    // Create a debit transaction for the adjustment
    // Set walletId directly (not the wallet entity) to ensure it's saved correctly
    const adjustmentTransaction = this.transactionRepository.create({
      walletId: wallet.id, // Set only the foreign key ID
      orderId: null,
      type: 'debit',
      category: 'adjustment',
      amount: currentBalance,
      description: `Wallet adjustment: Balance reset to zero from ${currentBalance}`
    });

    await this.transactionRepository.save(adjustmentTransaction);

    // Set wallet balance to zero
    wallet.balance = 0;
    await this.walletRepository.save(wallet);

    // IMPORTANT: Also update driver metadata to sync payable_balance
    // The profile reads payable_balance from drivers.metadata.payableBalance
    try {
      await this.driversService.updateMetadata(driverId, { payableBalance: 0 });
    } catch (error) {
      // Log error but don't fail the adjustment
      console.error('Failed to update driver metadata:', error);
    }

    return {
      success: true,
      message: 'Wallet balance adjusted to zero successfully'
    };
  }

  async getBankDetails(driverId: string) {
    try {
      const bankAccounts = await this.driversService.getBankAccountsForWithdrawMethods(driverId);
      return {
        bank_details: bankAccounts,
        total_size: bankAccounts.length
      };
    } catch (error) {
      // Return empty list on error
      return {
        bank_details: [],
        total_size: 0
      };
    }
  }
}

