import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DriverEntity } from '../../modules/drivers/entities/driver.entity.js';
import { OrderEntity } from '../../modules/orders/entities/order.entity.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stack_delivery',
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: true,
});
async function addActiveOrderForDemo() {
    console.log('🚀 Initializing database connection...');
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connection established\n');
        const driverRepo = AppDataSource.getRepository(DriverEntity);
        const orderRepo = AppDataSource.getRepository(OrderEntity);
        const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
        let demoDriver = null;
        console.log('🔍 Searching for demo driver...');
        for (const phone of demoPhones) {
            demoDriver = await driverRepo.findOne({ where: { phone } });
            if (demoDriver) {
                console.log(`✅ Found demo driver: ${demoDriver.name} (${demoDriver.phone})`);
                console.log(`   ID: ${demoDriver.id}\n`);
                break;
            }
        }
        if (!demoDriver) {
            console.error('❌ Demo driver not found! Please run: npm run create-demo-account');
            process.exit(1);
        }
        const existingActiveOrders = await orderRepo
            .createQueryBuilder('order')
            .where('order.driverId = :driverId', { driverId: demoDriver.id })
            .andWhere('order.status NOT IN (:...statuses)', {
            statuses: ['delivered', 'canceled', 'failed', 'refunded', 'refund_requested', 'refund_request_canceled']
        })
            .getMany();
        if (existingActiveOrders.length > 0) {
            console.log(`ℹ️  Demo driver already has ${existingActiveOrders.length} active order(s):`);
            existingActiveOrders.forEach((order, index) => {
                console.log(`   ${index + 1}. ${order.externalRef || order.id} - Status: ${order.status}`);
            });
            console.log('\n✅ Active order already exists. No need to create new one.');
            await AppDataSource.destroy();
            process.exit(0);
        }
        console.log('📦 Creating active order for demo driver...');
        const activeOrder = orderRepo.create({
            externalRef: 'DEMO-ACTIVE-001',
            pickup: {
                lat: 12.9716,
                lng: 77.5946,
                address: 'Pizza Hut, MG Road, Bengaluru, Karnataka 560001'
            },
            dropoff: {
                lat: 12.9558,
                lng: 77.6077,
                address: 'Prestige Tech Park, Whitefield, Bengaluru, Karnataka 560066'
            },
            status: 'assigned',
            paymentType: 'cash_on_delivery',
            items: [
                { name: 'Margherita Pizza', quantity: 1, price: 299 },
                { name: 'Garlic Bread', quantity: 1, price: 99 },
                { name: 'Coca Cola', quantity: 2, price: 60 }
            ],
            slaSeconds: 2700,
            trackingUrl: `http://localhost:3001/track/DEMO-ACTIVE-001`,
            driverId: demoDriver.id,
            assignedAt: new Date(),
            zoneId: demoDriver.zoneId || null,
        });
        const savedOrder = await orderRepo.save(activeOrder);
        console.log('✅ Active order created successfully!');
        console.log(`   Order ID: ${savedOrder.id}`);
        console.log(`   External Ref: ${savedOrder.externalRef}`);
        console.log(`   Status: ${savedOrder.status}`);
        console.log(`   Pickup: ${savedOrder.pickup.address}`);
        console.log(`   Dropoff: ${savedOrder.dropoff.address}`);
        console.log(`   Driver: ${demoDriver.name} (${demoDriver.phone})`);
        console.log(`   Tracking URL: ${savedOrder.trackingUrl}`);
        console.log('\n🎉 The order should now appear on the home screen!');
        await AppDataSource.destroy();
        console.log('\n✅ Database connection closed');
    }
    catch (error) {
        console.error('❌ Error:', error);
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
        process.exit(1);
    }
}
addActiveOrderForDemo();
