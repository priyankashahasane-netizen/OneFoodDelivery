import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
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
    private readonly driversService: DriversService,
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  /**
   * Get wallet by driver ID without loading relations
   * This prevents TypeORM relation syncing issues when the wallet is later saved
   */
  async getWalletByDriverId(driverId: string, includeRelations: boolean = false): Promise<DriverWalletEntity | null> {
    const options: any = { where: { driverId } };
    if (includeRelations) {
      options.relations = ['transactions'];
    }
    return await this.walletRepository.findOne(options);
  }

  async getWalletTransactions(
    driverId: string,
    limit: number = 25,
    offset: number = 0
  ) {
    // Don't load relations - we query transactions separately anyway
    const wallet = await this.getWalletByDriverId(driverId, false);
    
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
    // Use a database transaction with raw SQL to completely bypass TypeORM entity tracking
    // This prevents any relation syncing issues
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get wallet using raw SQL to avoid entity tracking
      const walletResult = await queryRunner.query(
        `SELECT id, balance, currency FROM driver_wallets WHERE driver_id = $1 LIMIT 1`,
        [driverId]
      );
      
      if (!walletResult || walletResult.length === 0) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        throw new NotFoundException(`Wallet not found for driver ${driverId}`);
      }

      const wallet = walletResult[0];
      const walletId = wallet.id;
      const currentBalance = parseFloat(wallet.balance);

      // If balance is already zero, return success
      if (currentBalance === 0) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return {
          success: true,
          message: 'Wallet balance is already zero'
        };
      }

      // Create a debit transaction using raw SQL to avoid any relation issues
      // Generate UUID in TypeScript to ensure consistency with TypeORM
      const transactionId = randomUUID();
      await queryRunner.query(
        `INSERT INTO wallet_transactions (id, wallet_id, order_id, type, category, amount, description, created_at)
         VALUES ($1, $2, NULL, $3, $4, $5, $6, NOW())`,
        [
          transactionId,
          walletId,
          'debit',
          'adjustment',
          currentBalance,
          `Wallet adjustment: Balance reset to zero from ${currentBalance}`
        ]
      );

      // Update wallet balance using raw SQL
      await queryRunner.query(
        `UPDATE driver_wallets SET balance = 0, updated_at = NOW() WHERE id = $1`,
        [walletId]
      );

      // Commit the transaction
      await queryRunner.commitTransaction();
      await queryRunner.release();

      // NOTE: Profile now reads payable_balance directly from wallet balance
      // Metadata update is optional and kept for backward compatibility
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
    } catch (error: any) {
      // Rollback transaction on error
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      await queryRunner.release();
      console.error('Error in adjustWalletToZero:', error);
      throw error;
    }
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

  /**
   * Deduct amount from wallet balance and create a debit transaction
   * Used when cash_on_delivery order is delivered
   */
  async deductFromWallet(
    driverId: string,
    amount: number,
    orderId: string,
    description?: string
  ): Promise<{ success: boolean; message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get wallet using raw SQL to avoid entity tracking
      const walletResult = await queryRunner.query(
        `SELECT id, balance, currency FROM driver_wallets WHERE driver_id = $1 LIMIT 1`,
        [driverId]
      );
      
      if (!walletResult || walletResult.length === 0) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        throw new NotFoundException(`Wallet not found for driver ${driverId}`);
      }

      const wallet = walletResult[0];
      const walletId = wallet.id;
      const currentBalance = parseFloat(wallet.balance);

      // Check if wallet has sufficient balance
      if (currentBalance < amount) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return {
          success: false,
          message: `Insufficient wallet balance. Current: ${currentBalance}, Required: ${amount}`
        };
      }

      const newBalance = currentBalance - amount;

      // Create a debit transaction using raw SQL
      const transactionId = randomUUID();
      await queryRunner.query(
        `INSERT INTO wallet_transactions (id, wallet_id, order_id, type, category, amount, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          transactionId,
          walletId,
          orderId,
          'debit',
          'cash_on_delivery',
          amount,
          description || `Cash on delivery order amount deducted for order ${orderId}`
        ]
      );

      // Update wallet balance using raw SQL
      await queryRunner.query(
        `UPDATE driver_wallets SET balance = $1, updated_at = NOW() WHERE id = $2`,
        [newBalance, walletId]
      );

      // Commit the transaction
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return {
        success: true,
        message: `Successfully deducted ${amount} from wallet balance`
      };
    } catch (error: any) {
      // Rollback transaction on error
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      await queryRunner.release();
      console.error('Error in deductFromWallet:', error);
      throw error;
    }
  }

  /**
   * Credit amount to wallet balance and create a credit transaction
   * Used when order is delivered to pay delivery charges to driver
   */
  async creditToWallet(
    driverId: string,
    amount: number,
    orderId: string,
    description?: string
  ): Promise<{ success: boolean; message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get wallet using raw SQL to avoid entity tracking
      const walletResult = await queryRunner.query(
        `SELECT id, balance, currency FROM driver_wallets WHERE driver_id = $1 LIMIT 1`,
        [driverId]
      );
      
      if (!walletResult || walletResult.length === 0) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        throw new NotFoundException(`Wallet not found for driver ${driverId}`);
      }

      const wallet = walletResult[0];
      const walletId = wallet.id;
      const currentBalance = parseFloat(wallet.balance);

      const newBalance = currentBalance + amount;

      // Create a credit transaction using raw SQL
      const transactionId = randomUUID();
      await queryRunner.query(
        `INSERT INTO wallet_transactions (id, wallet_id, order_id, type, category, amount, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          transactionId,
          walletId,
          orderId,
          'credit',
          'delivery_fee',
          amount,
          description || `Delivery charges credited for order ${orderId}`
        ]
      );

      // Update wallet balance using raw SQL
      await queryRunner.query(
        `UPDATE driver_wallets SET balance = $1, updated_at = NOW() WHERE id = $2`,
        [newBalance, walletId]
      );

      // Commit the transaction
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return {
        success: true,
        message: `Successfully credited ${amount} to wallet balance`
      };
    } catch (error: any) {
      // Rollback transaction on error
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      await queryRunner.release();
      console.error('Error in creditToWallet:', error);
      throw error;
    }
  }

  /**
   * Add initial balance to wallet during registration
   * Creates a credit transaction without requiring an orderId
   */
  async addInitialBalance(
    driverId: string,
    amount: number,
    description?: string
  ): Promise<{ success: boolean; message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get or create wallet using raw SQL
      let walletResult = await queryRunner.query(
        `SELECT id, balance, currency FROM driver_wallets WHERE driver_id = $1 LIMIT 1`,
        [driverId]
      );
      
      let walletId: string;
      let currentBalance = 0;
      let currency = 'INR';

      if (!walletResult || walletResult.length === 0) {
        // Create wallet if it doesn't exist
        walletId = randomUUID();
        await queryRunner.query(
          `INSERT INTO driver_wallets (id, driver_id, balance, currency, updated_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [walletId, driverId, 0, currency]
        );
      } else {
        walletId = walletResult[0].id;
        currentBalance = parseFloat(walletResult[0].balance);
        currency = walletResult[0].currency || 'INR';
      }

      const newBalance = currentBalance + amount;

      // Create a credit transaction using raw SQL
      const transactionId = randomUUID();
      await queryRunner.query(
        `INSERT INTO wallet_transactions (id, wallet_id, order_id, type, category, amount, description, created_at)
         VALUES ($1, $2, NULL, $3, $4, $5, $6, NOW())`,
        [
          transactionId,
          walletId,
          'credit',
          'initial_deposit',
          amount,
          description || `Initial wallet deposit during registration`
        ]
      );

      // Update wallet balance using raw SQL
      await queryRunner.query(
        `UPDATE driver_wallets SET balance = $1, updated_at = NOW() WHERE id = $2`,
        [newBalance, walletId]
      );

      // Commit the transaction
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return {
        success: true,
        message: `Successfully added ${amount} to wallet balance`
      };
    } catch (error: any) {
      // Rollback transaction on error
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      await queryRunner.release();
      console.error('Error in addInitialBalance:', error);
      throw error;
    }
  }
}

