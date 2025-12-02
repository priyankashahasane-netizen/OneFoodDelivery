import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DriversService } from './drivers.service.js';
import { DriverEntity } from './entities/driver.entity.js';
import { DriverBankAccountEntity } from './entities/driver-bank-account.entity.js';
import { DriverWalletEntity } from '../wallet/entities/driver-wallet.entity.js';
import { OrderEntity } from '../orders/entities/order.entity.js';

/**
 * Integration Tests for newDriverFunc
 * These tests use a REAL database connection
 * Make sure your database is running and DATABASE_URL is set correctly
 * 
 * To run: DATABASE_URL=postgres://user:pass@localhost:5432/dbname npm test -- drivers.service.integration.spec.ts
 */
describe('DriversService - newDriverFunc Integration Tests', () => {
  let service: DriversService;
  let dataSource: DataSource;
  let module: TestingModule;
  let isDatabaseAvailable = false;

  beforeAll(async () => {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️  DATABASE_URL not set. Skipping integration tests.');
      return;
    }

    try {
      module = await Test.createTestingModule({
        imports: [
          TypeOrmModule.forRoot({
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [DriverEntity, DriverBankAccountEntity, DriverWalletEntity, OrderEntity],
            synchronize: false,
            logging: false,
            autoLoadEntities: false,
          }),
          TypeOrmModule.forFeature([DriverEntity, DriverBankAccountEntity, DriverWalletEntity, OrderEntity]),
        ],
        providers: [DriversService],
      }).compile();

      service = module.get<DriversService>(DriversService);
      dataSource = module.get<DataSource>(DataSource);
      
      // Test connection
      if (dataSource && !dataSource.isInitialized) {
        await dataSource.initialize();
      }
      isDatabaseAvailable = true;
    } catch (error) {
      console.warn('⚠️  Could not connect to database:', error.message);
      isDatabaseAvailable = false;
    }
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    // Don't destroy the shared data source as it might be used elsewhere
  });

  beforeEach(async () => {
    // Clean up test data before each test
    if (isDatabaseAvailable && dataSource && dataSource.isInitialized) {
      const driverRepo = dataSource.getRepository(DriverEntity);

      // Delete test drivers (cascade will delete related records)
      const testPhones = [
        '+919999999999', '919999999999', '+91-9999999999',
        '+919999999998', '919999999998',
        '+919999999997', '919999999997',
        '+919999999996', '919999999996',
        '+919999999995', '919999999995',
      ];
      
      for (const phone of testPhones) {
        try {
          await driverRepo.delete({ phone });
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
    }
  });

  describe('newDriverFunc - Real Database Tests', () => {
    it('should create a new driver with wallet in the database', async () => {
      // Skip if database not available
      if (!isDatabaseAvailable || !dataSource || !dataSource.isInitialized) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      // Arrange
      const phone = '+919999999999';
      const driverData = {
        name: 'Test Driver',
        vehicleType: 'bike',
        capacity: 5,
      };

      // Act
      const result = await service.newDriverFunc(phone, driverData);

      // Assert
      expect(result.driver).toBeDefined();
      expect(result.driver.id).toBeDefined();
      expect(result.driver.phone).toBe(phone);
      expect(result.driver.name).toBe('Test Driver');
      expect(result.driver.vehicleType).toBe('bike');
      expect(result.driver.capacity).toBe(5);
      expect(result.driver.isActive).toBe(true);
      // New drivers should be created with isVerified = false
      expect(result.driver.isVerified).toBe(false);

      expect(result.wallet).toBeDefined();
      expect(result.wallet.id).toBeDefined();
      expect(result.wallet.driverId).toBe(result.driver.id);
      expect(result.wallet.balance).toBe(0);
      expect(result.wallet.currency).toBe('INR');

      // Verify in database
      const driverRepo = dataSource.getRepository(DriverEntity);
      const walletRepo = dataSource.getRepository(DriverWalletEntity);

      const savedDriver = await driverRepo.findOne({ where: { id: result.driver.id } });
      const savedWallet = await walletRepo.findOne({ where: { driverId: result.driver.id } });

      expect(savedDriver).toBeDefined();
      expect(savedDriver?.phone).toBe(phone);
      expect(savedWallet).toBeDefined();
      expect(savedWallet?.driverId).toBe(result.driver.id);
    });

    it('should create driver with wallet and bank account in the database', async () => {
      if (!isDatabaseAvailable || !dataSource || !dataSource.isInitialized) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      // Arrange
      const phone = '+919999999998';
      const driverData = {
        name: 'Test Driver With Bank',
        vehicleType: 'car',
        capacity: 10,
      };
      const options = {
        initialWalletBalance: 100.50,
        bankAccount: {
          account_holder_name: 'Test Driver With Bank',
          account_number: '9876543210',
          ifsc_code: 'TEST0001234',
          bank_name: 'Test Bank',
          branch_name: 'Test Branch',
          upi_id: 'test@paytm',
        },
      };

      // Act
      const result = await service.newDriverFunc(phone, driverData, options);

      // Assert
      expect(result.driver).toBeDefined();
      expect(result.wallet).toBeDefined();
      expect(result.wallet.balance).toBe(100.50);
      expect(result.bankAccount).toBeDefined();
      expect(result.bankAccount?.accountNumber).toBe('9876543210');

      // Verify in database
      const bankAccountRepo = dataSource.getRepository(DriverBankAccountEntity);
      const savedBankAccount = await bankAccountRepo.findOne({
        where: { driverId: result.driver.id, accountNumber: '9876543210' },
      });

      expect(savedBankAccount).toBeDefined();
      expect(savedBankAccount?.accountHolderName).toBe('Test Driver With Bank');
    });

    it('should update existing driver and create wallet if missing', async () => {
      if (!isDatabaseAvailable || !dataSource || !dataSource.isInitialized) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      // Arrange - First create a driver
      const phone = '+919999999997';
      const driverRepo = dataSource.getRepository(DriverEntity);

      const existingDriver = driverRepo.create({
        phone,
        name: phone,
        vehicleType: 'unknown',
        capacity: 1,
        isActive: false,
        isVerified: false,
      });
      await driverRepo.save(existingDriver);

      // Act - Update driver with newDriverFunc
      const result = await service.newDriverFunc(phone, {
        name: 'Updated Driver',
        vehicleType: 'bike',
        capacity: 5,
      });

      // Assert
      expect(result.driver.id).toBe(existingDriver.id);
      expect(result.driver.name).toBe('Updated Driver');
      expect(result.driver.vehicleType).toBe('bike');
      expect(result.driver.capacity).toBe(5);
      expect(result.driver.isActive).toBe(true);
      // isVerified should be preserved from existing driver, not automatically set to true
      expect(result.driver.isVerified).toBe(false);
      expect(result.wallet).toBeDefined();
    });

    it('should use phone as name fallback when name not provided', async () => {
      if (!isDatabaseAvailable || !dataSource || !dataSource.isInitialized) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      // Arrange
      const phone = '+919999999996';

      // Act
      const result = await service.newDriverFunc(phone);

      // Assert
      expect(result.driver.name).toBe(phone);
      expect(result.driver.vehicleType).toBe('unknown');
      expect(result.driver.capacity).toBe(1);
    });

    it('should handle phone number variations', async () => {
      if (!isDatabaseAvailable || !dataSource || !dataSource.isInitialized) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      // Arrange - Create driver with one phone format
      const phone1 = '919999999995';
      const driverRepo = dataSource.getRepository(DriverEntity);

      const existingDriver = driverRepo.create({
        phone: phone1,
        name: 'Existing Driver',
        vehicleType: 'bike',
        capacity: 5,
      });
      await driverRepo.save(existingDriver);

      // Act - Try to find with different format
      const phone2 = '+919999999995';
      const result = await service.newDriverFunc(phone2, {
        name: 'Updated Name',
      });

      // Assert - Should find and update existing driver
      expect(result.driver.id).toBe(existingDriver.id);
      expect(result.driver.name).toBe('Updated Name');
    });
  });
});

