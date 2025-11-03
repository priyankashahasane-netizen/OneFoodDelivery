import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ShiftEntity } from '../../modules/shifts/entities/shift.entity.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stack_delivery',
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: true,
});
async function createShifts() {
    console.log('🚀 Initializing database connection...');
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connection established');
        const shiftRepo = AppDataSource.getRepository(ShiftEntity);
        const existingShifts = await shiftRepo.count();
        if (existingShifts > 0) {
            console.log(`ℹ️  ${existingShifts} shifts already exist in database. Skipping creation.`);
            await AppDataSource.destroy();
            return;
        }
        const defaultShifts = [
            {
                name: 'Morning Shift',
                startTime: '08:00:00',
                endTime: '16:00:00',
                status: 1,
                driverId: null,
                zoneId: null
            },
            {
                name: 'Afternoon Shift',
                startTime: '12:00:00',
                endTime: '20:00:00',
                status: 1,
                driverId: null,
                zoneId: null
            },
            {
                name: 'Evening Shift',
                startTime: '16:00:00',
                endTime: '00:00:00',
                status: 1,
                driverId: null,
                zoneId: null
            },
            {
                name: 'Night Shift',
                startTime: '20:00:00',
                endTime: '08:00:00',
                status: 1,
                driverId: null,
                zoneId: null
            },
            {
                name: 'Full Day Shift',
                startTime: '06:00:00',
                endTime: '22:00:00',
                status: 1,
                driverId: null,
                zoneId: null
            }
        ];
        console.log('📝 Creating default shifts...');
        for (const shiftData of defaultShifts) {
            const shift = shiftRepo.create(shiftData);
            await shiftRepo.save(shift);
            console.log(`✅ Created shift: ${shiftData.name} (${shiftData.startTime} - ${shiftData.endTime})`);
        }
        console.log(`✅ Successfully created ${defaultShifts.length} shifts in database`);
        await AppDataSource.destroy();
        console.log('✅ Database connection closed');
    }
    catch (error) {
        console.error('❌ Error creating shifts:', error);
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
        process.exit(1);
    }
}
createShifts();
