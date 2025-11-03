import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { DriverEntity } from '../modules/drivers/entities/driver.entity.js';
import { OrderEntity } from '../modules/orders/entities/order.entity.js';
import { RoutePlanEntity } from '../modules/routes/entities/route-plan.entity.js';
import { TrackingPointEntity } from '../modules/tracking/entities/tracking-point.entity.js';
import { ShiftEntity } from '../modules/shifts/entities/shift.entity.js';
import { AuditLogEntity } from '../common/audit/audit.entity.js';
const databaseUrl = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/stack_delivery';
const schema = process.env.DATABASE_SCHEMA ?? 'public';
export const typeOrmDataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    schema,
    entities: [DriverEntity, OrderEntity, RoutePlanEntity, TrackingPointEntity, ShiftEntity, AuditLogEntity],
    synchronize: process.env.NODE_ENV !== 'production',
    migrations: ['dist/migrations/*.js'],
    migrationsTableName: 'migrations',
    logging: process.env.NODE_ENV !== 'production'
});
export default typeOrmDataSource;
