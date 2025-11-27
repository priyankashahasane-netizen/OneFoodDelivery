import 'reflect-metadata';
import { DataSource } from 'typeorm';
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
  entities: [],
  synchronize: false,
  logging: true,
});

/**
 * Generate a random number between min and max (inclusive)
 */
function getRandomDeliveryCharge(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Update delivery charges for all orders with random values between 25 and 50
 */
async function updateDeliveryCharges() {
  console.log('🚀 Updating delivery charges for all orders...');
  
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stack_delivery';
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@'); // Mask password
  console.log(`📊 Using database: ${maskedUrl}`);

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const queryRunner = AppDataSource.createQueryRunner();

    // Get all orders
    console.log('📝 Fetching all orders...');
    const orders = await queryRunner.query(`
      SELECT id 
      FROM orders 
      ORDER BY created_at ASC
    `);

    const totalOrders = orders.length;
    console.log(`📦 Found ${totalOrders} orders`);

    if (totalOrders === 0) {
      console.log('⚠️  No orders found in the database');
      await queryRunner.release();
      await AppDataSource.destroy();
      process.exit(0);
      return;
    }

    // Update each order with a random delivery charge between 25 and 50
    console.log('📝 Updating delivery charges (25-50 Rs)...');
    let updatedCount = 0;

    for (const order of orders) {
      const deliveryCharge = getRandomDeliveryCharge(25, 50);
      
      await queryRunner.query(`
        UPDATE orders 
        SET delivery_charge = $1 
        WHERE id = $2
      `, [deliveryCharge, order.id]);

      updatedCount++;
      
      if (updatedCount % 10 === 0) {
        console.log(`   Updated ${updatedCount}/${totalOrders} orders...`);
      }
    }

    await queryRunner.release();

    console.log(`✅ Successfully updated ${updatedCount} orders with random delivery charges (25-50 Rs)`);

    // Verify the update
    console.log('📊 Verifying updates...');
    const verification = await AppDataSource.query(`
      SELECT 
        COUNT(*) as total,
        MIN(delivery_charge) as min_charge,
        MAX(delivery_charge) as max_charge,
        AVG(delivery_charge) as avg_charge
      FROM orders
    `);

    const stats = verification[0];
    console.log(`   Total orders: ${stats.total}`);
    console.log(`   Min delivery charge: ₹${stats.min_charge}`);
    console.log(`   Max delivery charge: ₹${stats.max_charge}`);
    console.log(`   Avg delivery charge: ₹${parseFloat(stats.avg_charge).toFixed(2)}`);

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
    console.log('✅ Update completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during update:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      
      // Provide helpful error messages
      if (error.message.includes('password authentication failed')) {
        console.error('\n💡 TIP: Database password authentication failed.');
        console.error('   Please check your DATABASE_URL in .env file.');
        console.error('   You can also run the SQL script directly:');
        console.error('   psql $DATABASE_URL -f src/database/seeds/update-delivery-charges.sql');
      }
      
      if (error.message.includes('ECONNREFUSED') || error.message.includes('connection')) {
        console.error('\n💡 TIP: Cannot connect to database.');
        console.error('   Please ensure PostgreSQL is running.');
      }
    }
    // Only destroy connection if it was initialized
    if (AppDataSource.isInitialized) {
      try {
        await AppDataSource.destroy();
      } catch (destroyError) {
        console.error('   Error closing connection:', destroyError);
      }
    }
    process.exit(1);
  }
}

updateDeliveryCharges();

