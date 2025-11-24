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
 * Add customer_name, customer_phone, and customer_email columns to orders table
 * and backfill existing data where possible
 */
async function addCustomerFieldsToOrders() {
  console.log('🚀 Adding customer fields to orders table...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const queryRunner = AppDataSource.createQueryRunner();

    // Check if columns already exist
    const columnsCheck = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name IN ('customer_name', 'customer_phone', 'customer_email')
    `);

    const existingColumns = columnsCheck.map((row: any) => row.column_name);
    
    if (existingColumns.includes('customer_name') && 
        existingColumns.includes('customer_phone') && 
        existingColumns.includes('customer_email')) {
      console.log('✅ Customer fields already exist');
      await queryRunner.release();
      await AppDataSource.destroy();
      console.log('✅ Migration already applied');
      process.exit(0);
      return;
    }

    // Add customer_name column if it doesn't exist
    if (!existingColumns.includes('customer_name')) {
      console.log('📝 Adding customer_name column...');
      await queryRunner.query(`
        ALTER TABLE orders 
        ADD COLUMN customer_name VARCHAR(255) NULL
      `);
      console.log('✅ customer_name column added');
    }

    // Add customer_phone column if it doesn't exist
    if (!existingColumns.includes('customer_phone')) {
      console.log('📝 Adding customer_phone column...');
      await queryRunner.query(`
        ALTER TABLE orders 
        ADD COLUMN customer_phone VARCHAR(20) NULL
      `);
      console.log('✅ customer_phone column added');
    }

    // Add customer_email column if it doesn't exist
    if (!existingColumns.includes('customer_email')) {
      console.log('📝 Adding customer_email column...');
      await queryRunner.query(`
        ALTER TABLE orders 
        ADD COLUMN customer_email VARCHAR(255) NULL
      `);
      console.log('✅ customer_email column added');
    }

    // Add index on customer_phone for faster lookups
    console.log('📝 Adding index on customer_phone...');
    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_orders_customer_phone 
        ON orders(customer_phone)
      `);
      console.log('✅ Index on customer_phone created');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('✅ Index on customer_phone already exists');
      } else {
        throw error;
      }
    }

    // Try to backfill customer data from dropoff JSONB field if available
    // This attempts to extract customer info from the dropoff.address field
    // Note: This is a best-effort backfill - existing orders may not have customer data
    console.log('📝 Attempting to backfill customer data from existing order data...');
    
    try {
      // Check if dropoff field has any customer-related data
      const backfillResult = await queryRunner.query(`
        UPDATE orders 
        SET 
          customer_name = COALESCE(
            customer_name,
            CASE 
              WHEN dropoff::text LIKE '%contact_person_name%' 
              THEN (dropoff->>'contact_person_name')
              ELSE NULL
            END
          ),
          customer_phone = COALESCE(
            customer_phone,
            CASE 
              WHEN dropoff::text LIKE '%contact_person_number%' 
              THEN (dropoff->>'contact_person_number')
              WHEN dropoff::text LIKE '%phone%' 
              THEN (dropoff->>'phone')
              ELSE NULL
            END
          )
        WHERE customer_name IS NULL OR customer_phone IS NULL
      `);
      
      console.log(`✅ Backfilled customer data for orders where available`);
    } catch (error: any) {
      console.warn('⚠️  Could not backfill customer data (this is OK for new installations):', error.message);
    }

    await queryRunner.release();

    console.log('✅ Customer fields added successfully');
    console.log('✅ Index created on customer_phone');
    console.log('✅ Backfill completed (where data was available)');

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
    console.log('✅ Migration completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    await AppDataSource.destroy();
    process.exit(1);
  }
}

addCustomerFieldsToOrders();

