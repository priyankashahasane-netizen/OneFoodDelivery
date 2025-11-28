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
 * Add is_verified and is_active columns to drivers table
 */
async function addDriverVerificationColumns() {
  console.log('🚀 Adding is_verified and is_active columns to drivers table...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const queryRunner = AppDataSource.createQueryRunner();

    // Check if is_verified column already exists
    const isVerifiedExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'drivers' AND column_name = 'is_verified'
    `);

    // Check if is_active column already exists
    const isActiveExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'drivers' AND column_name = 'is_active'
    `);

    if (isVerifiedExists.length > 0 && isActiveExists.length > 0) {
      console.log('✅ is_verified and is_active columns already exist');
      await queryRunner.release();
      await AppDataSource.destroy();
      console.log('✅ Migration already applied');
      process.exit(0);
      return;
    }

    // Add is_verified column if it doesn't exist
    if (isVerifiedExists.length === 0) {
      console.log('📝 Adding is_verified column...');
      await queryRunner.query(`
        ALTER TABLE drivers 
        ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT true
      `);
      console.log('✅ is_verified column added successfully');
    } else {
      console.log('✅ is_verified column already exists');
    }

    // Add is_active column if it doesn't exist
    if (isActiveExists.length === 0) {
      console.log('📝 Adding is_active column...');
      await queryRunner.query(`
        ALTER TABLE drivers 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
      `);
      console.log('✅ is_active column added successfully');
    } else {
      console.log('✅ is_active column already exists');
    }

    // Update all existing records to have default values (should already be set by default, but ensure consistency)
    console.log('📝 Ensuring existing records have correct default values...');
    await queryRunner.query(`
      UPDATE drivers 
      SET is_verified = true 
      WHERE is_verified IS NULL
    `);
    await queryRunner.query(`
      UPDATE drivers 
      SET is_active = true 
      WHERE is_active IS NULL
    `);

    await queryRunner.release();

    console.log('✅ All existing records updated with default values');
    console.log('✅ Migration completed successfully!');

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
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

addDriverVerificationColumns();

