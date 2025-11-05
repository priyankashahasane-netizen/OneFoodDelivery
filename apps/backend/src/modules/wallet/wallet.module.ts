import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service.js';
import { DriverWalletEntity } from './entities/driver-wallet.entity.js';
import { WalletTransactionEntity } from './entities/wallet-transaction.entity.js';
import { DriversModule } from '../drivers/drivers.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverWalletEntity, WalletTransactionEntity]),
    DriversModule
  ],
  providers: [WalletService],
  exports: [WalletService]
})
export class WalletModule {}

