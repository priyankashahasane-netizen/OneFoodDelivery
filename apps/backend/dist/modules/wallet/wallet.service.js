var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverWalletEntity } from './entities/driver-wallet.entity.js';
import { WalletTransactionEntity } from './entities/wallet-transaction.entity.js';
import { DriversService } from '../drivers/drivers.service.js';
let WalletService = class WalletService {
    walletRepository;
    transactionRepository;
    driversService;
    constructor(walletRepository, transactionRepository, driversService) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.driversService = driversService;
    }
    async getWalletByDriverId(driverId) {
        return await this.walletRepository.findOne({
            where: { driverId },
            relations: ['transactions']
        });
    }
    async getWalletTransactions(driverId, limit = 25, offset = 0) {
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
        const mappedTransactions = transactions.map((txn, index) => {
            const currentBalance = parseFloat(wallet.balance.toString());
            const categoryToMethod = {
                'delivery_fee': 'delivery_fee',
                'bonus': 'bonus',
                'penalty': 'penalty',
                'withdrawal': 'withdrawal',
                'cash_on_delivery': 'cash',
                'payment': 'payment'
            };
            const method = categoryToMethod[txn.category] || txn.category || 'payment';
            let fromId = null;
            if (txn.orderId) {
                const parsed = parseInt(txn.orderId, 10);
                if (!isNaN(parsed)) {
                    fromId = parsed;
                }
                else {
                    const numericPart = txn.orderId.split('-')[0].replace(/\D/g, '');
                    fromId = numericPart ? parseInt(numericPart.substring(0, 8), 16) || index + 1 : index + 1;
                }
            }
            return {
                id: index + 1 + offset,
                from_type: txn.orderId ? 'order' : 'wallet',
                from_id: fromId,
                current_balance: currentBalance,
                amount: parseFloat(txn.amount.toString()),
                method: method,
                ref: txn.id.substring(0, 8).toUpperCase(),
                created_at: txn.createdAt.toISOString(),
                updated_at: txn.createdAt.toISOString(),
                type: txn.type,
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
    async adjustWalletToZero(driverId) {
        const wallet = await this.getWalletByDriverId(driverId);
        if (!wallet) {
            throw new NotFoundException(`Wallet not found for driver ${driverId}`);
        }
        if (!wallet.id) {
            throw new NotFoundException(`Wallet ID not found for driver ${driverId}`);
        }
        const currentBalance = parseFloat(wallet.balance.toString());
        if (currentBalance === 0) {
            return {
                success: true,
                message: 'Wallet balance is already zero'
            };
        }
        const adjustmentTransaction = this.transactionRepository.create({
            walletId: wallet.id,
            orderId: null,
            type: 'debit',
            category: 'adjustment',
            amount: currentBalance,
            description: `Wallet adjustment: Balance reset to zero from ${currentBalance}`
        });
        await this.transactionRepository.save(adjustmentTransaction);
        wallet.balance = 0;
        await this.walletRepository.save(wallet);
        try {
            await this.driversService.updateMetadata(driverId, { payableBalance: 0 });
        }
        catch (error) {
            console.error('Failed to update driver metadata:', error);
        }
        return {
            success: true,
            message: 'Wallet balance adjusted to zero successfully'
        };
    }
    async getBankDetails(driverId) {
        try {
            const bankAccounts = await this.driversService.getBankAccountsForWithdrawMethods(driverId);
            return {
                bank_details: bankAccounts,
                total_size: bankAccounts.length
            };
        }
        catch (error) {
            return {
                bank_details: [],
                total_size: 0
            };
        }
    }
};
WalletService = __decorate([
    Injectable(),
    __param(0, InjectRepository(DriverWalletEntity)),
    __param(1, InjectRepository(WalletTransactionEntity)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        DriversService])
], WalletService);
export { WalletService };
