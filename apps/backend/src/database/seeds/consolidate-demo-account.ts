import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DriverEntity } from '../../modules/drivers/entities/driver.entity.js';
import { OrderEntity } from '../../modules/orders/entities/order.entity.js';
import { RoutePlanEntity } from '../../modules/routes/entities/route-plan.entity.js';
import { TrackingPointEntity } from '../../modules/tracking/entities/tracking-point.entity.js';

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
 * Consolidate demo accounts to a single account with all data
 */
async function consolidateDemoAccount() {
  console.log('🚀 Initializing database connection...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const driverRepo = AppDataSource.getRepository(DriverEntity);
    const orderRepo = AppDataSource.getRepository(OrderEntity);
    const routePlanRepo = AppDataSource.getRepository(RoutePlanEntity);
    const trackingPointRepo = AppDataSource.getRepository(TrackingPointEntity);

    // Find all demo accounts by checking all phone variations
    const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
    const demoAccounts: DriverEntity[] = [];
    
    console.log('🔍 Searching for demo accounts...');
    for (const phone of demoPhones) {
      const driver = await driverRepo.findOne({ where: { phone } });
      if (driver) {
        // Check if we already found this driver (different phone format)
        const alreadyFound = demoAccounts.some(d => d.id === driver.id);
        if (!alreadyFound) {
          demoAccounts.push(driver);
          console.log(`   Found: ${driver.name} (${driver.phone}) - ID: ${driver.id}`);
        }
      }
    }

    if (demoAccounts.length === 0) {
      console.log('⚠️  No demo accounts found. Creating new one...');
      await createSingleDemoAccount(driverRepo);
      await AppDataSource.destroy();
      process.exit(0);
      return;
    }

    if (demoAccounts.length === 1) {
      console.log('✅ Only one demo account found. Ensuring all fields are populated...');
      const driver = demoAccounts[0];
      await ensureCompleteAccount(driverRepo, driver);
      console.log('✅ Demo account consolidation complete!');
      await AppDataSource.destroy();
      process.exit(0);
      return;
    }

    console.log(`\n📊 Found ${demoAccounts.length} demo accounts. Analyzing...`);

    // Count orders for each account
    const accountStats = await Promise.all(
      demoAccounts.map(async (driver) => {
        const orderCount = await orderRepo.count({ where: { driverId: driver.id } });
        const routePlanCount = await routePlanRepo.count({ where: { driverId: driver.id } });
        const trackingPointCount = await trackingPointRepo.count({ where: { driverId: driver.id } });
        
        return {
          driver,
          orderCount,
          routePlanCount,
          trackingPointCount,
          totalData: orderCount + routePlanCount + trackingPointCount,
        };
      })
    );

    // Sort by total data (most data = keep)
    accountStats.sort((a, b) => b.totalData - a.totalData);
    
    const accountToKeep = accountStats[0];
    const accountsToDelete = accountStats.slice(1);

    console.log('\n📋 Account Analysis:');
    accountStats.forEach((stat, index) => {
      const marker = index === 0 ? '✅ KEEP' : '❌ DELETE';
      console.log(`   ${marker}: ${stat.driver.phone} - ${stat.orderCount} orders, ${stat.routePlanCount} route plans, ${stat.trackingPointCount} tracking points`);
    });

    console.log(`\n🔧 Keeping account: ${accountToKeep.driver.phone} (ID: ${accountToKeep.driver.id})`);

    // Reassign data from accounts to delete
    for (const accountToDelete of accountsToDelete) {
      console.log(`\n🔄 Reassigning data from ${accountToDelete.driver.phone} to ${accountToKeep.driver.phone}...`);
      
      // Reassign orders
      const ordersToReassign = await orderRepo.find({ where: { driverId: accountToDelete.driver.id } });
      if (ordersToReassign.length > 0) {
        for (const order of ordersToReassign) {
          order.driverId = accountToKeep.driver.id;
          await orderRepo.save(order);
        }
        console.log(`   ✅ Reassigned ${ordersToReassign.length} orders`);
      }

      // Reassign route plans
      const routePlansToReassign = await routePlanRepo.find({ where: { driverId: accountToDelete.driver.id } });
      if (routePlansToReassign.length > 0) {
        for (const routePlan of routePlansToReassign) {
          routePlan.driverId = accountToKeep.driver.id;
          await routePlanRepo.save(routePlan);
        }
        console.log(`   ✅ Reassigned ${routePlansToReassign.length} route plans`);
      }

      // Reassign tracking points
      const trackingPointsToReassign = await trackingPointRepo.find({ where: { driverId: accountToDelete.driver.id } });
      if (trackingPointsToReassign.length > 0) {
        for (const trackingPoint of trackingPointsToReassign) {
          trackingPoint.driverId = accountToKeep.driver.id;
          await trackingPointRepo.save(trackingPoint);
        }
        console.log(`   ✅ Reassigned ${trackingPointsToReassign.length} tracking points`);
      }

      // Delete the account
      console.log(`   🗑️  Deleting account ${accountToDelete.driver.phone}...`);
      await driverRepo.remove(accountToDelete.driver);
      console.log(`   ✅ Deleted account ${accountToDelete.driver.phone}`);
    }

    // Ensure the kept account has all fields populated
    await ensureCompleteAccount(driverRepo, accountToKeep.driver);

    // Update phone to preferred format (+919975008124) if needed
    if (accountToKeep.driver.phone !== '+919975008124') {
      // Check if +919975008124 is available
      const existingWithPreferred = await driverRepo.findOne({ where: { phone: '+919975008124' } });
      if (!existingWithPreferred) {
        accountToKeep.driver.phone = '+919975008124';
        await driverRepo.save(accountToKeep.driver);
        console.log(`   ✅ Updated phone to preferred format: +919975008124`);
      }
    }

    // Final stats
    const finalOrderCount = await orderRepo.count({ where: { driverId: accountToKeep.driver.id } });
    const finalRoutePlanCount = await routePlanRepo.count({ where: { driverId: accountToKeep.driver.id } });
    const finalTrackingPointCount = await trackingPointRepo.count({ where: { driverId: accountToKeep.driver.id } });

    console.log('\n✅ Consolidation Complete!');
    console.log('\n📊 Final Demo Account Stats:');
    console.log(`   Phone: ${accountToKeep.driver.phone}`);
    console.log(`   ID: ${accountToKeep.driver.id}`);
    console.log(`   Orders: ${finalOrderCount}`);
    console.log(`   Route Plans: ${finalRoutePlanCount}`);
    console.log(`   Tracking Points: ${finalTrackingPointCount}`);
    console.log(`   Name: ${accountToKeep.driver.name}`);
    console.log(`   Vehicle Type: ${accountToKeep.driver.vehicleType}`);
    console.log(`   Capacity: ${accountToKeep.driver.capacity}`);
    console.log(`   Online: ${accountToKeep.driver.online}`);

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error consolidating demo account:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

/**
 * Ensure demo account has all required fields populated
 */
async function ensureCompleteAccount(driverRepo: any, driver: DriverEntity) {
  console.log(`\n🔧 Ensuring all fields are populated for ${driver.phone}...`);

  const password = 'Pri@0110';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Complete mock profile data with all fields
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
    // Profile information
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

  // Update driver with complete data
  driver.name = driver.name || 'Demo Driver';
  driver.vehicleType = driver.vehicleType || 'bike';
  driver.capacity = driver.capacity || 5;
  driver.online = driver.online ?? false;
  
  // Set location if not set (default to Bengaluru)
  if (driver.latitude === null || driver.longitude === null) {
    driver.latitude = 12.9716;
    driver.longitude = 77.5946;
    console.log('   ✅ Set default location (Bengaluru)');
  }

  // Set last seen if not set
  if (driver.lastSeenAt === null) {
    driver.lastSeenAt = new Date();
    console.log('   ✅ Set last seen timestamp');
  }

  // Merge metadata, ensuring all fields are present
  driver.metadata = {
    ...mockProfileData,
    ...(driver.metadata || {}),
    password: hashedPassword, // Always ensure password is set
  };

  await driverRepo.save(driver);
  console.log('   ✅ All fields populated successfully');
}

/**
 * Create a single demo account if none exists
 */
async function createSingleDemoAccount(driverRepo: any) {
  const password = 'Pri@0110';
  const hashedPassword = await bcrypt.hash(password, 10);

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

  const driver = driverRepo.create({
    phone: '+919975008124',
    name: 'Demo Driver',
    vehicleType: 'bike',
    capacity: 5,
    online: false,
    latitude: 12.9716,
    longitude: 77.5946,
    lastSeenAt: new Date(),
    metadata: mockProfileData,
  });

  const savedDriver = await driverRepo.save(driver);
  console.log(`✅ Created demo account: ${savedDriver.phone} (ID: ${savedDriver.id})`);
  return savedDriver;
}

consolidateDemoAccount();

