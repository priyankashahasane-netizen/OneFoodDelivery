import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { OrderEntity } from '../../modules/orders/entities/order.entity.js';
import { DriverEntity } from '../../modules/drivers/entities/driver.entity.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * TypeORM DataSource configuration
 */
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stack_delivery',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: true,
});

/**
 * Reassign all mock orders to the demo account
 */
async function reassignOrdersToDemo() {
  console.log('🚀 Initializing database connection...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const orderRepo = AppDataSource.getRepository(OrderEntity);
    const driverRepo = AppDataSource.getRepository(DriverEntity);

    // Find the demo account driver (phone: 9975008124 or +919975008124)
    const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
    let demoDriver = null;
    
    for (const phone of demoPhones) {
      demoDriver = await driverRepo.findOne({ where: { phone } });
      if (demoDriver) {
        console.log(`📱 Found demo account driver with phone: ${phone} (ID: ${demoDriver.id})`);
        break;
      }
    }

    if (!demoDriver) {
      console.error('❌ Demo account driver not found! Please run: npm run create-demo-account');
      process.exit(1);
    }

    // Find all mock orders (orders with external_ref containing MOCK)
    const mockOrders = await orderRepo
      .createQueryBuilder('order')
      .where("order.external_ref LIKE :pattern", { pattern: '%MOCK%' })
      .getMany();

    console.log(`📦 Found ${mockOrders.length} mock orders to reassign`);

    // Reassign all mock orders to demo driver
    let reassignedCount = 0;
    for (const order of mockOrders) {
      if (order.driverId !== demoDriver.id) {
        order.driverId = demoDriver.id;
        if (!order.assignedAt && order.status !== 'pending') {
          order.assignedAt = order.createdAt || new Date();
        }
        await orderRepo.save(order);
        reassignedCount++;
      }
    }

    console.log(`✅ Reassigned ${reassignedCount} orders to demo account (${demoDriver.name})`);
    console.log(`ℹ️  ${mockOrders.length - reassignedCount} orders were already assigned to demo account`);

    // Show order counts by status
    const statusCounts = await orderRepo
      .createQueryBuilder('order')
      .where('order.driverId = :driverId', { driverId: demoDriver.id })
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    console.log('\n📊 Order counts by status for demo account:');
    statusCounts.forEach(({ status, count }) => {
      console.log(`   ${status}: ${count}`);
    });

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error reassigning orders:', error);
    process.exit(1);
  }
}

reassignOrdersToDemo();

