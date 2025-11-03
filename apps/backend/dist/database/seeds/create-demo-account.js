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
            driver.phone = phoneToUse;
            driver.name = driver.name || 'Demo Driver';
            driver.metadata = {
                ...mockProfileData,
                ...driver.metadata,
                password: hashedPassword,
            };
            await driverRepo.save(driver);
            console.log(`✅ Updated driver account with password and profile data`);
        }
        else {
            console.log(`➕ Creating new driver with phone: ${phoneToUse}`);
            driver = driverRepo.create({
                phone: phoneToUse,
                name: 'Demo Driver',
                vehicleType: 'bike',
                capacity: 5,
                online: false,
                metadata: mockProfileData,
            });
            driver = await driverRepo.save(driver);
            console.log(`✅ Created new driver account with profile data`);
        }
        const phoneWithoutCode = '9975008124';
        let driverWithoutCode = await driverRepo.findOne({ where: { phone: phoneWithoutCode } });
        if (!driverWithoutCode && driver.phone !== phoneWithoutCode) {
            console.log(`➕ Also creating driver with phone: ${phoneWithoutCode} (without country code)`);
            driverWithoutCode = driverRepo.create({
                phone: phoneWithoutCode,
                name: 'Demo Driver',
                vehicleType: 'bike',
                capacity: 5,
                online: false,
                metadata: mockProfileData,
            });
            await driverRepo.save(driverWithoutCode);
            console.log(`✅ Created second driver account without country code`);
        }
        else if (driverWithoutCode && driverWithoutCode.id !== driver.id) {
            driverWithoutCode.metadata = {
                ...mockProfileData,
                ...driverWithoutCode.metadata,
                password: hashedPassword,
            };
            await driverRepo.save(driverWithoutCode);
            console.log(`✅ Updated driver account without country code with profile data`);
        }
        console.log('\n📋 Demo Account Details:');
        console.log(`   Phone: 9975008124 (or +919975008124)`);
        console.log(`   Password: ${password}`);
        console.log(`   Driver ID: ${driver.id}`);
        console.log('\n✅ Demo account created/updated successfully!');
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
