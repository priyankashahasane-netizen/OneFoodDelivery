import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { DriverEntity } from '../modules/drivers/entities/driver.entity.js';
import { DriverBankAccountEntity } from '../modules/drivers/entities/driver-bank-account.entity.js';
import { MapperEntity } from '../modules/drivers/entities/mapper.entity.js';
import { OrderEntity } from '../modules/orders/entities/order.entity.js';
import { ProofOfDeliveryEntity } from '../modules/orders/entities/proof-of-delivery.entity.js';
import { RoutePlanEntity } from '../modules/routes/entities/route-plan.entity.js';
import { TrackingPointEntity } from '../modules/tracking/entities/tracking-point.entity.js';
import { ShiftEntity } from '../modules/shifts/entities/shift.entity.js';
import { SubscriptionEntity } from '../modules/subscriptions/entities/subscription.entity.js';
import { SubscriptionExecutionEntity } from '../modules/subscriptions/entities/subscription-execution.entity.js';
import { NotificationEntity } from '../modules/notifications/entities/notification.entity.js';
import { DriverWalletEntity } from '../modules/wallet/entities/driver-wallet.entity.js';
import { WalletTransactionEntity } from '../modules/wallet/entities/wallet-transaction.entity.js';
import { WithdrawalRequestEntity } from '../modules/wallet/entities/withdrawal-request.entity.js';
import { AuditLogEntity } from '../common/audit/audit.entity.js';
import { RestaurantEntity } from '../modules/restaurants/entities/restaurant.entity.js';
import { AdminEntity } from '../modules/admins/entities/admin.entity.js';

const databaseUrl = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/stack_delivery';
const schema = process.env.DATABASE_SCHEMA ?? 'public';

export const typeOrmDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  schema,
  entities: [
    DriverEntity,
    DriverBankAccountEntity,
    MapperEntity,
    OrderEntity,
    ProofOfDeliveryEntity,
    RoutePlanEntity,
    TrackingPointEntity,
    ShiftEntity,
    SubscriptionEntity,
    SubscriptionExecutionEntity,
    NotificationEntity,
    DriverWalletEntity,
    WalletTransactionEntity,
    WithdrawalRequestEntity,
    AuditLogEntity,
    RestaurantEntity,
    AdminEntity
  ],
  synchronize: process.env.NODE_ENV !== 'production', // Auto-create tables in development
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
  logging: process.env.NODE_ENV !== 'production'
});

export default typeOrmDataSource;

