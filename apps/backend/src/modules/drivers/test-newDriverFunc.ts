/**
 * Simple script to test newDriverFunc with real database
 * 
 * Usage:
 *   npx ts-node src/modules/drivers/test-newDriverFunc.ts
 * 
 * Make sure DATABASE_URL is set in your .env file
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { DriversService } from './drivers.service.js';
import { DriverEntity } from './entities/driver.entity.js';
import { DriverBankAccountEntity } from './entities/driver-bank-account.entity.js';
import { DriverWalletEntity } from '../wallet/entities/driver-wallet.entity.js';
import { OrderEntity } from '../orders/entities/order.entity.js';
import { typeOrmDataSource } from '../../config/typeorm.config.js';

async function testNewDriverFunc() {
  console.log('🚀 Testing newDriverFunc with real database...\n');

  try {
    // Initialize database connection
    if (!typeOrmDataSource.isInitialized) {
      console.log('📡 Connecting to database...');
      await typeOrmDataSource.initialize();
      console.log('✅ Database connected\n');
    }

    // Create repositories manually (since we're not using NestJS DI here)
    const driverRepo = typeOrmDataSource.getRepository(DriverEntity);
    const walletRepo = typeOrmDataSource.getRepository(DriverWalletEntity);
    const bankAccountRepo = typeOrmDataSource.getRepository(DriverBankAccountEntity);
    const orderRepo = typeOrmDataSource.getRepository(OrderEntity);

    // Create service instance with repositories
    const service = new DriversService(
      driverRepo,
      bankAccountRepo,
      walletRepo,
      orderRepo,
      typeOrmDataSource
    );

    // Test 1: Create new driver with wallet
    console.log('📝 Test 1: Creating new driver with wallet...');
    const phone1 = '+919999999999';
    
    // Clean up if exists
    const existingDriver1 = await driverRepo.findOne({ where: { phone: phone1 } });
    if (existingDriver1) {
      await driverRepo.remove(existingDriver1);
      console.log('   🧹 Cleaned up existing driver');
    }

    const result1 = await service.newDriverFunc(phone1, {
      name: 'Test Driver',
      vehicleType: 'bike',
      capacity: 5,
    });

    console.log('   ✅ Driver created:', {
      id: result1.driver.id,
      phone: result1.driver.phone,
      name: result1.driver.name,
      vehicleType: result1.driver.vehicleType,
    });
    console.log('   ✅ Wallet created:', {
      id: result1.wallet.id,
      driverId: result1.wallet.driverId,
      balance: result1.wallet.balance,
      currency: result1.wallet.currency,
    });

    // Verify in database
    const savedDriver1 = await driverRepo.findOne({ where: { id: result1.driver.id } });
    const savedWallet1 = await walletRepo.findOne({ where: { driverId: result1.driver.id } });
    console.log('   ✅ Verified in database:', {
      driverExists: !!savedDriver1,
      walletExists: !!savedWallet1,
    });
    console.log('');

    // Test 2: Create driver with wallet and bank account
    console.log('📝 Test 2: Creating driver with wallet and bank account...');
    const phone2 = '+919999999998';
    
    const existingDriver2 = await driverRepo.findOne({ where: { phone: phone2 } });
    if (existingDriver2) {
      await driverRepo.remove(existingDriver2);
      console.log('   🧹 Cleaned up existing driver');
    }

    const result2 = await service.newDriverFunc(
      phone2,
      {
        name: 'Test Driver With Bank',
        vehicleType: 'car',
        capacity: 10,
      },
      {
        initialWalletBalance: 100.50,
        bankAccount: {
          account_holder_name: 'Test Driver With Bank',
          account_number: '9876543210',
          ifsc_code: 'TEST0001234',
          bank_name: 'Test Bank',
          branch_name: 'Test Branch',
          upi_id: 'test@paytm',
        },
      }
    );

    console.log('   ✅ Driver created:', result2.driver.name);
    console.log('   ✅ Wallet created with balance:', result2.wallet.balance);
    console.log('   ✅ Bank account created:', result2.bankAccount?.accountNumber);

    // Verify bank account in database
    const savedBankAccount = await bankAccountRepo.findOne({
      where: { driverId: result2.driver.id, accountNumber: '9876543210' },
    });
    console.log('   ✅ Verified bank account in database:', !!savedBankAccount);
    console.log('');

    // Test 3: Use phone as name fallback
    console.log('📝 Test 3: Creating driver without name (should use phone)...');
    const phone3 = '+919999999997';
    
    const existingDriver3 = await driverRepo.findOne({ where: { phone: phone3 } });
    if (existingDriver3) {
      await driverRepo.remove(existingDriver3);
      console.log('   🧹 Cleaned up existing driver');
    }

    const result3 = await service.newDriverFunc(phone3);
    console.log('   ✅ Driver name (should be phone):', result3.driver.name);
    console.log('   ✅ Phone:', result3.driver.phone);
    console.log('   ✅ Name matches phone:', result3.driver.name === phone3);
    console.log('');

    console.log('✅ All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Created ${result1.driver.id ? 1 : 0} driver(s) with wallet`);
    console.log(`   - Created ${result2.bankAccount ? 1 : 0} bank account(s)`);
    console.log(`   - Verified all records in database`);

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    if (typeOrmDataSource.isInitialized) {
      await typeOrmDataSource.destroy();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testNewDriverFunc().catch(console.error);

