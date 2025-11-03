import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DriverEntity } from '../../modules/drivers/entities/driver.entity.js';
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
async function createDemoAccount() {
    console.log('🚀 Initializing database connection...');
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connection established');
        const driverRepo = AppDataSource.getRepository(DriverEntity);
        const phoneVariations = [
            '9975008124',
            '+919975008124',
            '+91-9975008124',
            '919975008124',
        ];
        let driver = null;
        for (const phone of phoneVariations) {
            driver = await driverRepo.findOne({ where: { phone } });
            if (driver) {
                console.log(`📱 Found existing driver with phone: ${phone}`);
                break;
            }
        }
        const phoneToUse = '+919975008124';
        const password = 'Pri@0110';
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(`🔐 Password hashed successfully`);
        const mockProfileData = {
            password: hashedPassword,
            email: 'demo.driver@example.com',
            balance: 1250.75,
            cashInHands: 125.50,
            todaysEarning: 125.50,
            thisWeekEarning: 875.25,
            thisMonthEarning: 3250.00,
            payableBalance: 1250.75,
            withDrawableBalance: 1000.00,
            totalWithdrawn: 5000.00,
            totalIncentiveEarning: 150.00,
            earnings: 1,
            orderCount: 342,
            todaysOrderCount: 8,
            thisWeekOrderCount: 45,
            imageFullUrl: '',
            fcmToken: '',
            identityNumber: '',
            identityType: '',
            identityImage: '',
            avgRating: 4.8,
            ratingCount: 125,
            memberSinceDays: 180,
            shiftName: 'Morning Shift',
            shiftStartTime: '08:00:00',
            shiftEndTime: '16:00:00',
            type: 'free_zone',
            adjustable: true,
            overFlowWarning: false,
            overFlowBlockWarning: false,
            showPayNowButton: false,
            incentiveList: [],
        };
        if (driver) {
            console.log(`🔄 Updating existing driver with phone: ${phoneToUse}`);
            if (driver.phone !== phoneToUse) {
                const existingWithPreferred = await driverRepo.findOne({ where: { phone: phoneToUse } });
                if (!existingWithPreferred) {
                    driver.phone = phoneToUse;
                    console.log(`   ✅ Updated phone to preferred format: ${phoneToUse}`);
                }
                else {
                    console.log(`   ⚠️  Phone ${phoneToUse} already exists, keeping current phone: ${driver.phone}`);
                }
            }
            driver.name = driver.name || 'Demo Driver';
            driver.vehicleType = driver.vehicleType || 'bike';
            driver.capacity = driver.capacity || 5;
            driver.online = driver.online ?? false;
            if (driver.latitude === null || driver.longitude === null) {
                driver.latitude = 12.9716;
                driver.longitude = 77.5946;
                console.log(`   ✅ Set default location (Bengaluru)`);
            }
            if (driver.lastSeenAt === null) {
                driver.lastSeenAt = new Date();
                console.log(`   ✅ Set last seen timestamp`);
            }
            driver.metadata = {
                ...mockProfileData,
                ...driver.metadata,
                password: hashedPassword,
            };
            await driverRepo.save(driver);
            console.log(`✅ Updated driver account with password and complete profile data`);
        }
        else {
            console.log(`➕ Creating new driver with phone: ${phoneToUse}`);
            driver = driverRepo.create({
                phone: phoneToUse,
                name: 'Demo Driver',
                vehicleType: 'bike',
                capacity: 5,
                online: false,
                latitude: 12.9716,
                longitude: 77.5946,
                lastSeenAt: new Date(),
                metadata: mockProfileData,
            });
            driver = await driverRepo.save(driver);
            console.log(`✅ Created new driver account with complete profile data`);
        }
        console.log('\n📋 Demo Account Details:');
        console.log(`   Phone: ${driver.phone}`);
        console.log(`   Password: ${password}`);
        console.log(`   Driver ID: ${driver.id}`);
        console.log(`   Name: ${driver.name}`);
        console.log(`   Vehicle Type: ${driver.vehicleType}`);
        console.log(`   Capacity: ${driver.capacity}`);
        console.log(`   Location: ${driver.latitude}, ${driver.longitude}`);
        console.log('\n✅ Demo account created/updated successfully!');
        console.log('\n💡 Note: Only ONE demo account is created. Use both phone formats (9975008124 or +919975008124) to log in.');
        await AppDataSource.destroy();
        console.log('✅ Database connection closed');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error creating demo account:', error);
        process.exit(1);
    }
}
createDemoAccount();
