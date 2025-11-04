import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { NotificationEntity } from '../../modules/notifications/entities/notification.entity.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stack_delivery',
    entities: [NotificationEntity],
    synchronize: true,
    logging: true,
});
async function createNotificationsTable() {
    console.log('🚀 Creating notifications table...');
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connection established');
        const notificationRepo = AppDataSource.getRepository(NotificationEntity);
        try {
            await notificationRepo.count();
            console.log('✅ Notifications table already exists');
        }
        catch (error) {
            console.log('⚠️  Table might not exist, synchronize should create it');
        }
        await AppDataSource.synchronize();
        console.log('✅ Database synchronized - notifications table should now exist');
        await AppDataSource.destroy();
        console.log('✅ Database connection closed');
        console.log('✅ Notifications table created successfully!');
        process.exit(0);
    }
    catch (error) {
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
