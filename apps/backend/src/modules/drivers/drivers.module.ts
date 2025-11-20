import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DriverEntity } from './entities/driver.entity.js';
import { DriverBankAccountEntity } from './entities/driver-bank-account.entity.js';
import { DriverWalletEntity } from '../wallet/entities/driver-wallet.entity.js';
import { OrderEntity } from '../orders/entities/order.entity.js';
import { DriversController } from './drivers.controller.js';
import { DriversService } from './drivers.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([DriverEntity, DriverBankAccountEntity, DriverWalletEntity, OrderEntity])],
  providers: [DriversService],
  controllers: [DriversController],
  exports: [DriversService]
})
export class DriversModule {}


