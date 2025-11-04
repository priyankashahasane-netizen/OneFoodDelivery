import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { NotificationEntity } from '../../modules/notifications/entities/notification.entity.js';

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
  entities: [NotificationEntity],
  synchronize: true, // This will create the table if it doesn't exist
  logging: true,
});

/**
 * Create notifications table if it doesn't exist
 */
async function createNotificationsTable() {
  console.log('🚀 Creating notifications table...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Get the repository - this will trigger table creation if synchronize is true
    const notificationRepo = AppDataSource.getRepository(NotificationEntity);
    
    // Try to query the table to see if it exists
    try {
      await notificationRepo.count();
      console.log('✅ Notifications table already exists');
    } catch (error) {
      console.log('⚠️  Table might not exist, synchronize should create it');
    }

    // Force synchronization
    await AppDataSource.synchronize();
    console.log('✅ Database synchronized - notifications table should now exist');

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
    console.log('✅ Notifications table created successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during table creation:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    await AppDataSource.destroy();
    process.exit(1);
  }
}

createNotificationsTable();

