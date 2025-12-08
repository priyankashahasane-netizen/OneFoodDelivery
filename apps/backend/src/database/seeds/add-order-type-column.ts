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
 * Add order_type column to orders table
 */
async function addOrderTypeColumn() {
  console.log('🚀 Adding order_type column to orders table...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const queryRunner = AppDataSource.createQueryRunner();

    // Check if column already exists
    const columnExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'order_type'
    `);

    if (columnExists.length > 0) {
      console.log('✅ order_type column already exists');
      await queryRunner.release();
      await AppDataSource.destroy();
      console.log('✅ Migration already applied');
      process.exit(0);
      return;
    }

    // Add the column with default value
    console.log('📝 Adding order_type column...');
    await queryRunner.query(`
      ALTER TABLE orders 
      ADD COLUMN order_type VARCHAR(32) NOT NULL DEFAULT 'regular'
    `);

    // Update all existing records to 'regular' (should already be set by default, but ensure consistency)
    console.log('📝 Updating existing records to order_type = "regular"...');
    await queryRunner.query(`
      UPDATE orders 
      SET order_type = 'regular' 
      WHERE order_type IS NULL OR order_type = ''
    `);

    // Add check constraint to only allow 'regular' or 'subscription'
    console.log('📝 Adding check constraint...');
    await queryRunner.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT orders_order_type_check 
      CHECK (order_type IN ('regular', 'subscription'))
    `);

    await queryRunner.release();

    console.log('✅ order_type column added successfully');
    console.log('✅ All existing records updated to order_type = "regular"');
    console.log('✅ Check constraint added to enforce valid values');

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

addOrderTypeColumn();



