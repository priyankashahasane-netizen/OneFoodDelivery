import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { DriversModule } from '../drivers/drivers.module.js';
import { ShiftsModule } from '../shifts/shifts.module.js';
import { WalletModule } from '../wallet/wallet.module.js';
import { DeliveryManController } from './delivery-man.controller.js';

@Module({
  imports: [OrdersModule, DriversModule, ShiftsModule, WalletModule],
  controllers: [DeliveryManController]
})
export class DeliveryManModule {}

