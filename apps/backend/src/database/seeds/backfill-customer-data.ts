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
 * Backfill all orders with customer data
 */
async function backfillCustomerData() {
  console.log('🚀 Backfilling customer data for all orders...');

  const customerName = 'Priyanka';
  const customerPhone = '9975008124';
  const customerEmail = 'priyanka.shahasane@futurescapetech.com';

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const queryRunner = AppDataSource.createQueryRunner();

    // Check if customer columns exist
    const columnsCheck = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name IN ('customer_name', 'customer_phone', 'customer_email')
    `);

    const existingColumns = columnsCheck.map((row: any) => row.column_name);
    
    if (!existingColumns.includes('customer_name') || 
        !existingColumns.includes('customer_phone') || 
        !existingColumns.includes('customer_email')) {
      console.error('❌ Customer columns do not exist. Please run the migration first:');
      console.error('   npm run add-customer-fields-to-orders');
      await queryRunner.release();
      await AppDataSource.destroy();
      process.exit(1);
      return;
    }

    // Get count of orders to update
    const countResult = await queryRunner.query(`
      SELECT COUNT(*) as count FROM orders
    `);
    const totalOrders = parseInt(countResult[0].count, 10);
    console.log(`📊 Found ${totalOrders} orders to update`);

    // Update all orders with customer data
    console.log('📝 Updating all orders with customer data...');
    console.log(`   Customer Name: ${customerName}`);
    console.log(`   Customer Phone: ${customerPhone}`);
    console.log(`   Customer Email: ${customerEmail}`);

    const updateResult = await queryRunner.query(`
      UPDATE orders 
      SET 
        customer_name = $1,
        customer_phone = $2,
        customer_email = $3
      WHERE customer_name IS NULL 
         OR customer_phone IS NULL 
         OR customer_email IS NULL
         OR customer_name != $1
         OR customer_phone != $2
         OR customer_email != $3
    `, [customerName, customerPhone, customerEmail]);

    // Get count of updated orders
    const updatedCountResult = await queryRunner.query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE customer_name = $1 
        AND customer_phone = $2 
        AND customer_email = $3
    `, [customerName, customerPhone, customerEmail]);
    
    const updatedCount = parseInt(updatedCountResult[0].count, 10);

    await queryRunner.release();

    console.log(`✅ Successfully updated ${updatedCount} out of ${totalOrders} orders`);
    console.log('✅ Customer data backfill completed!');

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
    console.log('✅ Backfill completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during backfill:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    await AppDataSource.destroy();
    process.exit(1);
  }
}

backfillCustomerData();

