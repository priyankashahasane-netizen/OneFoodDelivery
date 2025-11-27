import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { OrderEntity } from '../../modules/orders/entities/order.entity.js';

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
  logging: false,
});

/**
 * Sample items to use when fixing orders
 */
const sampleItems = [
  [{ name: 'Margherita Pizza', quantity: 1, price: 299 }],
  [{ name: 'Pepperoni Pizza', quantity: 1, price: 399 }],
  [{ name: 'Big Mac Combo', quantity: 2, price: 780 }],
  [{ name: 'Chicken Burger', quantity: 2, price: 240 }],
  [{ name: 'Chicken Biryani', quantity: 1, price: 250 }],
  [{ name: 'Veg Thali', quantity: 1, price: 180 }],
  [{ name: 'Paneer Tikka', quantity: 1, price: 220 }],
  [{ name: 'Butter Chicken', quantity: 1, price: 350 }],
  [{ name: 'Fried Rice', quantity: 1, price: 150 }],
  [{ name: 'Noodles', quantity: 1, price: 140 }],
  [{ name: 'Dosa', quantity: 2, price: 120 }],
  [{ name: 'Idli Sambar', quantity: 2, price: 80 }],
  [{ name: 'Pav Bhaji', quantity: 1, price: 100 }],
  [{ name: 'Vada Pav', quantity: 2, price: 40 }],
  [{ name: 'Samosa', quantity: 4, price: 60 }],
];

/**
 * Get random element from array
 */
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Check and fix orders with missing items
 */
async function fixOrdersWithMissingItems() {
  console.log('🔍 Checking for orders with missing items...\n');

  // Show connection info (without password) for debugging
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stack_delivery';
  const dbUrlSafe = dbUrl.replace(/:[^:@]+@/, ':****@'); // Hide password
  console.log(`📡 Database URL: ${dbUrlSafe}\n`);

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    const orderRepo = AppDataSource.getRepository(OrderEntity);

    // Find all orders
    const allOrders = await orderRepo.find({
      order: { createdAt: 'DESC' },
    });

    console.log(`📦 Total orders in database: ${allOrders.length}\n`);

    // Filter orders with missing or empty items
    const ordersWithMissingItems = allOrders.filter((order) => {
      const items = order.items as any[] | null;
      return !items || items.length === 0;
    });

    console.log(`⚠️  Found ${ordersWithMissingItems.length} orders with missing or empty items\n`);

    if (ordersWithMissingItems.length === 0) {
      console.log('✅ All orders have items! No fixes needed.');
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
      process.exit(0);
    }

    // Display orders that need fixing
    console.log('📋 Orders that need fixing:');
    ordersWithMissingItems.forEach((order, index) => {
      const numericId = Math.abs(order.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000000;
      console.log(`   ${index + 1}. Order #${numericId} (${order.id.substring(0, 8)}...) - Status: ${order.status} - External Ref: ${order.externalRef || 'N/A'}`);
    });

    console.log('\n🔧 Fixing orders...\n');

    let fixedCount = 0;
    const fixedOrders: Array<{ id: string; numericId: number; items: any[] }> = [];

    for (const order of ordersWithMissingItems) {
      // Assign random sample items
      const items = randomElement(sampleItems);
      
      // Update the order
      order.items = items;
      await orderRepo.save(order);
      
      const numericId = Math.abs(order.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000000;
      fixedOrders.push({ id: order.id, numericId, items });
      fixedCount++;
      
      console.log(`   ✅ Fixed Order #${numericId} - Added ${items.length} item(s)`);
    }

    console.log(`\n✅ Successfully fixed ${fixedCount} orders!\n`);

    // Summary
    console.log('📊 Summary:');
    console.log(`   Total orders checked: ${allOrders.length}`);
    console.log(`   Orders with missing items: ${ordersWithMissingItems.length}`);
    console.log(`   Orders fixed: ${fixedCount}`);

    // Show sample of fixed orders
    if (fixedOrders.length > 0) {
      console.log('\n📝 Sample of fixed orders:');
      fixedOrders.slice(0, 5).forEach((order) => {
        console.log(`   Order #${order.numericId}:`);
        order.items.forEach((item: any) => {
          console.log(`     - ${item.name} x${item.quantity} - ₹${item.price}`);
        });
      });
    }

    await AppDataSource.destroy();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during fix process:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
      
      // Check if it's a database connection error
      if (error.message.includes('password authentication failed') || error.message.includes('connection')) {
        console.error('\n💡 Database Connection Issue:');
        console.error('   Please check your DATABASE_URL in .env file');
        console.error('   Current DATABASE_URL format: postgres://username:password@host:port/database');
        console.error('   Make sure the username, password, and database name are correct.\n');
        console.error('   To test your connection, try:');
        console.error('   psql -U <username> -d stack_delivery -h localhost');
        console.error('   Or check if PostgreSQL is running: pg_isready');
        console.error('\n   Common solutions:');
        console.error('   1. Verify PostgreSQL is running: brew services list | grep postgres');
        console.error('   2. Check if user exists: psql -U postgres -c "\\du"');
        console.error('   3. Create user if needed: psql -U postgres -c "CREATE USER futurescapetechnology-priyanka WITH PASSWORD \'12345678\';"');
        console.error('   4. Grant permissions: psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE stack_delivery TO futurescapetechnology-priyanka;"');
      }
    }
    
    // Only destroy connection if it was initialized
    if (AppDataSource.isInitialized) {
      try {
        await AppDataSource.destroy();
      } catch (destroyError) {
        // Ignore destroy errors
      }
    }
    process.exit(1);
  }
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixOrdersWithMissingItems();
}

export { fixOrdersWithMissingItems };

