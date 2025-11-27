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
 * Add delivery_charge column to orders table
 */
async function addDeliveryChargeColumn() {
  console.log('🚀 Adding delivery_charge column to orders table...');
  
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stack_delivery';
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@'); // Mask password
  console.log(`📊 Using database: ${maskedUrl}`);

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const queryRunner = AppDataSource.createQueryRunner();

    // Check if column already exists
    const columnExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'delivery_charge'
    `);

    if (columnExists.length > 0) {
      console.log('✅ delivery_charge column already exists');
      await queryRunner.release();
      await AppDataSource.destroy();
      console.log('✅ Migration already applied');
      process.exit(0);
      return;
    }

    // Add the column with default value
    console.log('📝 Adding delivery_charge column...');
    await queryRunner.query(`
      ALTER TABLE orders 
      ADD COLUMN delivery_charge DECIMAL(10, 2) NOT NULL DEFAULT 0
    `);

    // Update all existing records to 0 (should already be set by default, but ensure consistency)
    console.log('📝 Updating existing records to delivery_charge = 0...');
    await queryRunner.query(`
      UPDATE orders 
      SET delivery_charge = 0 
      WHERE delivery_charge IS NULL
    `);

    await queryRunner.release();

    console.log('✅ delivery_charge column added successfully');
    console.log('✅ All existing records updated to delivery_charge = 0');

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

addDeliveryChargeColumn();

