import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { seedDemoData } from './demo-data.seed';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * TypeORM DataSource configuration for seeding
 */
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stack_delivery',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: true,
});

/**
 * Main seeding function
 */
async function runSeed() {
  console.log('🚀 Initializing database connection...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    await seedDemoData(AppDataSource);

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

runSeed();
