import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DriverEntity } from '../../modules/drivers/entities/driver.entity.js';

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
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: true,
});

/**
 * Create demo account with phone 9975008124 and password Pri@0110
 * Handles phone numbers with or without country code
 */
async function createDemoAccount() {
  console.log('🚀 Initializing database connection...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const driverRepo = AppDataSource.getRepository(DriverEntity);

    // Phone number variations to check (with and without country code)
    const phoneVariations = [
      '9975008124',        // Without country code
      '+919975008124',     // With +91 (India)
      '+91-9975008124',    // With +91 and dash
      '919975008124',      // With 91 (without +)
    ];

    let driver = null;

    // Try to find existing driver with any of the phone variations
    for (const phone of phoneVariations) {
      driver = await driverRepo.findOne({ where: { phone } });
      if (driver) {
        console.log(`📱 Found existing driver with phone: ${phone}`);
        break;
      }
    }

    // Determine which phone number to use (prefer +91 for Indian numbers)
    const phoneToUse = '+919975008124';

    // Hash the password
    const password = 'Pri@0110';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`🔐 Password hashed successfully`);

    // Mock profile data for demo account - all fields with non-null values
    const mockProfileData = {
      password: hashedPassword,
      email: 'demo.driver@example.com',
      // Financial fields
      balance: 1250.75,
      cashInHands: 125.50,
      todaysEarning: 125.50,
      thisWeekEarning: 875.25,
      thisMonthEarning: 3250.00,
      payableBalance: 1250.75,
      withDrawableBalance: 1000.00,
      totalWithdrawn: 5000.00,
      totalIncentiveEarning: 150.00,
      earnings: 1, // Enable earnings feature
      // Order statistics
      orderCount: 342,
      todaysOrderCount: 8,
      thisWeekOrderCount: 45,
      // Profile information - use empty strings instead of null
      imageFullUrl: '',
      fcmToken: '',
      identityNumber: '',
      identityType: '',
      identityImage: '',
      // Ratings
      avgRating: 4.8,
      ratingCount: 125,
      memberSinceDays: 180,
      // Shifts
      shiftName: 'Morning Shift',
      shiftStartTime: '08:00:00',
      shiftEndTime: '16:00:00',
      // Other
      type: 'free_zone',
      adjustable: true,
      overFlowWarning: false,
      overFlowBlockWarning: false,
      showPayNowButton: false,
      incentiveList: [],
    };

    if (driver) {
      // Update existing driver
      console.log(`🔄 Updating existing driver with phone: ${phoneToUse}`);
      driver.phone = phoneToUse; // Normalize to +91 format
      driver.name = driver.name || 'Demo Driver';
      driver.metadata = {
        ...mockProfileData,
        ...driver.metadata,
        password: hashedPassword, // Ensure password is set
      };
      await driverRepo.save(driver);
      console.log(`✅ Updated driver account with password and profile data`);
    } else {
      // Create new driver
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

    // Also create account without country code for flexibility
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
    } else if (driverWithoutCode && driverWithoutCode.id !== driver.id) {
      // Update existing driver without country code
      driverWithoutCode.metadata = {
        ...mockProfileData,
        ...driverWithoutCode.metadata,
        password: hashedPassword, // Ensure password is set
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
  } catch (error) {
    console.error('❌ Error creating demo account:', error);
    process.exit(1);
  }
}

createDemoAccount();
