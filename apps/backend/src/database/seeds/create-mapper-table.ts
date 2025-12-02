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
 * Create mapper table
 */
async function createMapperTable() {
  console.log('🚀 Creating mapper table...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const queryRunner = AppDataSource.createQueryRunner();

    // Check if table already exists
    const tableExists = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'mapper'
    `);

    if (tableExists.length > 0) {
      console.log('✅ mapper table already exists');
      
      // Check if old_sso_user_id column exists
      const columnExists = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'mapper' 
        AND column_name = 'old_sso_user_id'
      `);
      
      if (columnExists.length === 0) {
        console.log('📝 Adding old_sso_user_id column to existing mapper table...');
        await queryRunner.query(`
          ALTER TABLE mapper 
          ADD COLUMN old_sso_user_id VARCHAR(255) NULL
        `);
        console.log('✅ old_sso_user_id column added successfully');
      } else {
        console.log('✅ old_sso_user_id column already exists');
      }
      
      await queryRunner.release();
      await AppDataSource.destroy();
      console.log('✅ Migration completed');
      process.exit(0);
      return;
    }

    // Create the mapper table
    console.log('📝 Creating mapper table...');
    await queryRunner.query(`
      CREATE TABLE mapper (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        driver_id UUID NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        old_sso_user_id VARCHAR(255) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_mapper_driver 
          FOREIGN KEY (driver_id) 
          REFERENCES drivers(id) 
          ON DELETE CASCADE
      )
    `);

    // Create indexes
    console.log('📝 Creating indexes...');
    await queryRunner.query(`
      CREATE INDEX idx_mapper_driver_id ON mapper(driver_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_mapper_user_id ON mapper(user_id)
    `);

    // Create unique constraint to prevent duplicate mappings
    console.log('📝 Creating unique constraint...');
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_mapper_driver_user_unique ON mapper(driver_id, user_id)
    `);

    await queryRunner.release();

    console.log('✅ mapper table created successfully');
    console.log('✅ Indexes created');
    console.log('✅ Unique constraint added to prevent duplicate mappings');

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

createMapperTable();

