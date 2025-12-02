import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { DriversService } from './drivers.service.js';
import { DriverEntity } from './entities/driver.entity.js';
import { DriverBankAccountEntity } from './entities/driver-bank-account.entity.js';
import { DriverWalletEntity } from '../wallet/entities/driver-wallet.entity.js';
import { OrderEntity } from '../orders/entities/order.entity.js';

/**
 * Drivers Service Tests
 * Tests for newDriverFunc - creates driver and all associated records
 */
describe('DriversService - newDriverFunc', () => {
  let service: DriversService;
  let driversRepository: Repository<DriverEntity>;
  let walletRepository: Repository<DriverWalletEntity>;
  let bankAccountRepository: Repository<DriverBankAccountEntity>;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  const mockDriversRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockWalletRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockBankAccountRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockOrdersRepository = {
    count: jest.fn(),
  };

  // Mock QueryRunner for transaction handling
  const mockQueryRunner = {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        {
          provide: getRepositoryToken(DriverEntity),
          useValue: mockDriversRepository,
        },
        {
          provide: getRepositoryToken(DriverWalletEntity),
          useValue: mockWalletRepository,
        },
        {
          provide: getRepositoryToken(DriverBankAccountEntity),
          useValue: mockBankAccountRepository,
        },
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: mockOrdersRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<DriversService>(DriversService);
    driversRepository = module.get<Repository<DriverEntity>>(getRepositoryToken(DriverEntity));
    walletRepository = module.get<Repository<DriverWalletEntity>>(getRepositoryToken(DriverWalletEntity));
    bankAccountRepository = module.get<Repository<DriverBankAccountEntity>>(getRepositoryToken(DriverBankAccountEntity));
    dataSource = module.get<DataSource>(DataSource);
    queryRunner = mockQueryRunner as unknown as QueryRunner;

    jest.clearAllMocks();
  });

  describe('newDriverFunc - Create new driver', () => {
    it('should create a new driver with wallet when driver does not exist', async () => {
      // Arrange
      const phone = '+919876543210';
      const driverId = 'driver-uuid-123';
      const walletId = 'wallet-uuid-123';

      const mockDriver: Partial<DriverEntity> = {
        id: driverId,
        phone,
        name: phone, // Uses phone as name fallback
        vehicleType: 'unknown',
        capacity: 1,
        online: false,
        status: 'offline',
        isVerified: false, // New drivers should be created with isVerified = false
        isActive: true,
      };

      const mockWallet: Partial<DriverWalletEntity> = {
        id: walletId,
        driverId,
        balance: 0,
        currency: 'INR',
      };

      // Mock: Driver doesn't exist
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(null) // First call: find driver by phone
        .mockResolvedValueOnce(null); // Second call: find wallet

      // Mock: Create and save driver
      mockQueryRunner.manager.create.mockReturnValueOnce(mockDriver as DriverEntity);
      mockQueryRunner.manager.save
        .mockResolvedValueOnce(mockDriver as DriverEntity) // Save driver
        .mockResolvedValueOnce(mockWallet as DriverWalletEntity); // Save wallet

      // Act
      const result = await service.newDriverFunc(phone);

      // Assert
      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.findOne).toHaveBeenCalledWith(DriverEntity, {
        where: { phone },
      });
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        DriverEntity,
        expect.objectContaining({
          phone,
          name: phone, // Should use phone as name fallback
          vehicleType: 'unknown',
          capacity: 1,
          isVerified: false, // New drivers should be created with isVerified = false
          isActive: true,
        })
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(2);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();

      expect(result.driver).toEqual(mockDriver);
      expect(result.wallet).toEqual(mockWallet);
      expect(result.bankAccount).toBeUndefined();
    });

    it('should create driver with provided name instead of phone', async () => {
      // Arrange
      const phone = '+919876543210';
      const driverName = 'John Doe';
      const driverId = 'driver-uuid-123';
      const walletId = 'wallet-uuid-123';

      const mockDriver: Partial<DriverEntity> = {
        id: driverId,
        phone,
        name: driverName,
        vehicleType: 'bike',
        capacity: 5,
        isVerified: false, // New drivers should be created with isVerified = false
        isActive: true,
      };

      const mockWallet: Partial<DriverWalletEntity> = {
        id: walletId,
        driverId,
        balance: 0,
        currency: 'INR',
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockQueryRunner.manager.create.mockReturnValueOnce(mockDriver as DriverEntity);
      mockQueryRunner.manager.save
        .mockResolvedValueOnce(mockDriver as DriverEntity)
        .mockResolvedValueOnce(mockWallet as DriverWalletEntity);

      // Act
      const result = await service.newDriverFunc(phone, {
        name: driverName,
        vehicleType: 'bike',
        capacity: 5,
      });

      // Assert
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        DriverEntity,
        expect.objectContaining({
          phone,
          name: driverName, // Should use provided name
          vehicleType: 'bike',
          capacity: 5,
        })
      );
      expect(result.driver.name).toBe(driverName);
    });

    it('should create wallet with initial balance if provided', async () => {
      // Arrange
      const phone = '+919876543210';
      const driverId = 'driver-uuid-123';
      const walletId = 'wallet-uuid-123';
      const initialBalance = 100.50;

      const mockDriver: Partial<DriverEntity> = {
        id: driverId,
        phone,
        name: phone,
      };

      const mockWallet: Partial<DriverWalletEntity> = {
        id: walletId,
        driverId,
        balance: initialBalance,
        currency: 'INR',
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockQueryRunner.manager.create.mockReturnValueOnce(mockDriver as DriverEntity);
      mockQueryRunner.manager.save
        .mockResolvedValueOnce(mockDriver as DriverEntity)
        .mockResolvedValueOnce(mockWallet as DriverWalletEntity);

      // Act
      const result = await service.newDriverFunc(phone, undefined, {
        initialWalletBalance: initialBalance,
      });

      // Assert
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        DriverWalletEntity,
        expect.objectContaining({
          driverId,
          balance: initialBalance,
          currency: 'INR',
        })
      );
      expect(result.wallet.balance).toBe(initialBalance);
    });

    it('should create bank account if provided', async () => {
      // Arrange
      const phone = '+919876543210';
      const driverId = 'driver-uuid-123';
      const walletId = 'wallet-uuid-123';
      const bankAccountId = 'bank-account-uuid-123';

      const mockDriver: Partial<DriverEntity> = {
        id: driverId,
        phone,
        name: phone,
      };

      const mockWallet: Partial<DriverWalletEntity> = {
        id: walletId,
        driverId,
        balance: 0,
        currency: 'INR',
      };

      const mockBankAccount: Partial<DriverBankAccountEntity> = {
        id: bankAccountId,
        driverId,
        accountHolderName: 'John Doe',
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        branchName: 'MG Road Branch',
        upiId: 'john.doe@paytm',
        isVerified: false,
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(null) // Driver not found
        .mockResolvedValueOnce(null) // Wallet not found
        .mockResolvedValueOnce(null); // Bank account not found

      mockQueryRunner.manager.create
        .mockReturnValueOnce(mockDriver as DriverEntity)
        .mockReturnValueOnce(mockWallet as DriverWalletEntity)
        .mockReturnValueOnce(mockBankAccount as DriverBankAccountEntity);

      mockQueryRunner.manager.save
        .mockResolvedValueOnce(mockDriver as DriverEntity)
        .mockResolvedValueOnce(mockWallet as DriverWalletEntity)
        .mockResolvedValueOnce(mockBankAccount as DriverBankAccountEntity);

      // Act
      const result = await service.newDriverFunc(
        phone,
        undefined,
        {
          bankAccount: {
            account_holder_name: 'John Doe',
            account_number: '1234567890',
            ifsc_code: 'HDFC0001234',
            bank_name: 'HDFC Bank',
            branch_name: 'MG Road Branch',
            upi_id: 'john.doe@paytm',
          },
        }
      );

      // Assert
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        DriverBankAccountEntity,
        expect.objectContaining({
          driverId,
          accountHolderName: 'John Doe',
          accountNumber: '1234567890',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          branchName: 'MG Road Branch',
          upiId: 'john.doe@paytm',
          isVerified: false,
        })
      );
      expect(result.bankAccount).toEqual(mockBankAccount);
    });
  });

  describe('newDriverFunc - Update existing driver', () => {
    it('should update existing driver and create wallet if missing', async () => {
      // Arrange
      const phone = '+919876543210';
      const driverId = 'driver-uuid-123';
      const walletId = 'wallet-uuid-123';

      const existingDriver: Partial<DriverEntity> = {
        id: driverId,
        phone,
        name: phone,
        vehicleType: 'unknown',
        capacity: 1,
        isActive: false,
        isVerified: false,
      };

      const updatedDriver: Partial<DriverEntity> = {
        ...existingDriver,
        name: 'John Doe',
        vehicleType: 'bike',
        capacity: 5,
        isActive: true,
        // isVerified should be preserved from existing driver, not automatically set to true
        isVerified: false,
      };

      const mockWallet: Partial<DriverWalletEntity> = {
        id: walletId,
        driverId,
        balance: 0,
        currency: 'INR',
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(existingDriver as DriverEntity) // Driver exists
        .mockResolvedValueOnce(null); // Wallet doesn't exist

      mockQueryRunner.manager.save
        .mockResolvedValueOnce(updatedDriver as DriverEntity)
        .mockResolvedValueOnce(mockWallet as DriverWalletEntity);

      // Act
      const result = await service.newDriverFunc(phone, {
        name: 'John Doe',
        vehicleType: 'bike',
        capacity: 5,
      });

      // Assert
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        DriverEntity,
        expect.objectContaining({
          id: driverId,
          name: 'John Doe',
          vehicleType: 'bike',
          capacity: 5,
          isActive: true,
          // isVerified should be preserved from existing driver, not automatically set to true
          isVerified: false,
        })
      );
      expect(result.driver.name).toBe('John Doe');
      expect(result.wallet).toEqual(mockWallet);
    });

    it('should use existing wallet if it already exists', async () => {
      // Arrange
      const phone = '+919876543210';
      const driverId = 'driver-uuid-123';
      const walletId = 'wallet-uuid-123';

      const existingDriver: Partial<DriverEntity> = {
        id: driverId,
        phone,
        name: phone,
      };

      const existingWallet: Partial<DriverWalletEntity> = {
        id: walletId,
        driverId,
        balance: 50.00,
        currency: 'INR',
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(existingDriver as DriverEntity)
        .mockResolvedValueOnce(existingWallet as DriverWalletEntity);

      mockQueryRunner.manager.save.mockResolvedValueOnce(existingDriver as DriverEntity);

      // Act
      const result = await service.newDriverFunc(phone);

      // Assert
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(1); // Only driver, not wallet
      expect(result.wallet).toEqual(existingWallet);
      expect(result.wallet.balance).toBe(50.00);
    });

    it('should update wallet balance if initial balance provided and wallet exists', async () => {
      // Arrange
      const phone = '+919876543210';
      const driverId = 'driver-uuid-123';
      const walletId = 'wallet-uuid-123';
      const newBalance = 200.00;

      const existingDriver: Partial<DriverEntity> = {
        id: driverId,
        phone,
        name: phone,
      };

      const existingWallet: Partial<DriverWalletEntity> = {
        id: walletId,
        driverId,
        balance: 50.00,
        currency: 'INR',
      };

      const updatedWallet: Partial<DriverWalletEntity> = {
        ...existingWallet,
        balance: newBalance,
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(existingDriver as DriverEntity)
        .mockResolvedValueOnce(existingWallet as DriverWalletEntity);

      mockQueryRunner.manager.save
        .mockResolvedValueOnce(existingDriver as DriverEntity)
        .mockResolvedValueOnce(updatedWallet as DriverWalletEntity);

      // Act
      const result = await service.newDriverFunc(phone, undefined, {
        initialWalletBalance: newBalance,
      });

      // Assert
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        DriverWalletEntity,
        expect.objectContaining({
          balance: newBalance,
        })
      );
      expect(result.wallet.balance).toBe(newBalance);
    });
  });

  describe('newDriverFunc - Phone number variations', () => {
    it('should find driver with phone variation if exact match not found', async () => {
      // Arrange
      const phone = '+919876543210';
      const phoneVariation = '919876543210';
      const driverId = 'driver-uuid-123';

      const existingDriver: Partial<DriverEntity> = {
        id: driverId,
        phone: phoneVariation,
        name: phoneVariation,
      };

      const mockWallet: Partial<DriverWalletEntity> = {
        id: 'wallet-uuid-123',
        driverId,
        balance: 0,
        currency: 'INR',
      };

      // First call: exact phone not found, second call: variation found
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(null) // Exact phone not found
        .mockResolvedValueOnce(existingDriver as DriverEntity) // Variation found
        .mockResolvedValueOnce(null); // Wallet not found

      mockQueryRunner.manager.save
        .mockResolvedValueOnce(existingDriver as DriverEntity)
        .mockResolvedValueOnce(mockWallet as DriverWalletEntity);

      // Act
      const result = await service.newDriverFunc(phone);

      // Assert
      expect(mockQueryRunner.manager.findOne).toHaveBeenCalledTimes(3);
      expect(result.driver).toEqual(existingDriver);
    });
  });

  describe('newDriverFunc - Error handling', () => {
    it('should rollback transaction on error', async () => {
      // Arrange
      const phone = '+919876543210';
      const error = new Error('Database error');

      mockQueryRunner.manager.findOne.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(service.newDriverFunc(phone)).rejects.toThrow('Database error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('should handle bank account creation failure and rollback', async () => {
      // Arrange
      const phone = '+919876543210';
      const driverId = 'driver-uuid-123';
      const error = new Error('Bank account creation failed');

      const mockDriver: Partial<DriverEntity> = {
        id: driverId,
        phone,
        name: phone,
      };

      const mockWallet: Partial<DriverWalletEntity> = {
        id: 'wallet-uuid-123',
        driverId,
        balance: 0,
        currency: 'INR',
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null); // Bank account not found

      mockQueryRunner.manager.create
        .mockReturnValueOnce(mockDriver as DriverEntity)
        .mockReturnValueOnce(mockWallet as DriverWalletEntity)
        .mockReturnValueOnce({} as DriverBankAccountEntity);

      mockQueryRunner.manager.save
        .mockResolvedValueOnce(mockDriver as DriverEntity)
        .mockResolvedValueOnce(mockWallet as DriverWalletEntity)
        .mockRejectedValueOnce(error); // Bank account save fails

      // Act & Assert
      await expect(
        service.newDriverFunc(phone, undefined, {
          bankAccount: {
            account_holder_name: 'John Doe',
            account_number: '1234567890',
            ifsc_code: 'HDFC0001234',
            bank_name: 'HDFC Bank',
          },
        })
      ).rejects.toThrow('Bank account creation failed');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('newDriverFunc - Complete flow', () => {
    it('should create driver with all associated records in single transaction', async () => {
      // Arrange
      const phone = '+919876543210';
      const driverId = 'driver-uuid-123';
      const walletId = 'wallet-uuid-123';
      const bankAccountId = 'bank-account-uuid-123';

      const mockDriver: Partial<DriverEntity> = {
        id: driverId,
        phone,
        name: 'John Doe',
        vehicleType: 'bike',
        capacity: 5,
        latitude: 12.9716,
        longitude: 77.5946,
        homeAddress: '123 Main St',
        homeAddressLatitude: 12.9716,
        homeAddressLongitude: 77.5946,
        zoneId: 'zone-123',
        isVerified: false, // New drivers should be created with isVerified = false
        isActive: true,
      };

      const mockWallet: Partial<DriverWalletEntity> = {
        id: walletId,
        driverId,
        balance: 100.00,
        currency: 'INR',
      };

      const mockBankAccount: Partial<DriverBankAccountEntity> = {
        id: bankAccountId,
        driverId,
        accountHolderName: 'John Doe',
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        isVerified: false,
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(null) // Driver not found
        .mockResolvedValueOnce(null) // Wallet not found
        .mockResolvedValueOnce(null); // Bank account not found

      mockQueryRunner.manager.create
        .mockReturnValueOnce(mockDriver as DriverEntity)
        .mockReturnValueOnce(mockWallet as DriverWalletEntity)
        .mockReturnValueOnce(mockBankAccount as DriverBankAccountEntity);

      mockQueryRunner.manager.save
        .mockResolvedValueOnce(mockDriver as DriverEntity)
        .mockResolvedValueOnce(mockWallet as DriverWalletEntity)
        .mockResolvedValueOnce(mockBankAccount as DriverBankAccountEntity);

      // Act
      const result = await service.newDriverFunc(
        phone,
        {
          name: 'John Doe',
          vehicleType: 'bike',
          capacity: 5,
          latitude: 12.9716,
          longitude: 77.5946,
          homeAddress: '123 Main St',
          homeAddressLatitude: 12.9716,
          homeAddressLongitude: 77.5946,
          zoneId: 'zone-123',
        },
        {
          initialWalletBalance: 100.00,
          bankAccount: {
            account_holder_name: 'John Doe',
            account_number: '1234567890',
            ifsc_code: 'HDFC0001234',
            bank_name: 'HDFC Bank',
          },
        }
      );

      // Assert
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.driver).toEqual(mockDriver);
      expect(result.wallet).toEqual(mockWallet);
      expect(result.bankAccount).toEqual(mockBankAccount);
    });
  });
});

