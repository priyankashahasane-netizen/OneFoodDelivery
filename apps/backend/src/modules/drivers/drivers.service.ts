import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { UpdateDriverDto } from './dto/update-driver.dto.js';
import { CreateDriverDto } from './dto/create-driver.dto.js';
import { DriverEntity } from './entities/driver.entity.js';
import { DriverProfileResponseDto } from './dto/driver-profile-response.dto.js';
import { DriverBankAccountEntity } from './entities/driver-bank-account.entity.js';
import { DriverWalletEntity } from '../wallet/entities/driver-wallet.entity.js';
import { OrderEntity } from '../orders/entities/order.entity.js';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(DriverEntity)
    private readonly driversRepository: Repository<DriverEntity>,
    @InjectRepository(DriverBankAccountEntity)
    private readonly bankAccountRepository: Repository<DriverBankAccountEntity>,
    @InjectRepository(DriverWalletEntity)
    private readonly walletRepository: Repository<DriverWalletEntity>,
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  async listDrivers(pagination: PaginationQueryDto) {
    const { page = 1, pageSize = 25 } = pagination;
    const [items, total] = await this.driversRepository.findAndCount({
      take: pageSize,
      skip: (page - 1) * pageSize,
      order: { updatedAt: 'DESC' }
    });
    return { items, total, page, pageSize };
  }

  async findById(driverId: string) {
    // Explicitly select all columns including isVerified and isActive to ensure they're loaded from DB
    const driver = await this.driversRepository.findOne({ 
      where: { id: driverId },
      select: [
        'id', 'name', 'phone', 'vehicleType', 'capacity', 'online', 'status',
        'ratingAvg', 'kycStatus', 'latitude', 'longitude', 
        'homeAddress', 'homeAddressLatitude', 'homeAddressLongitude',
        'lastSeenAt', 'ipAddress', 'metadata', 'zoneId', 
        'isVerified', 'isActive', 'createdAt', 'updatedAt'
      ]
    });
    if (!driver) {
      throw new NotFoundException(`Driver ${driverId} not found`);
    }
    return driver;
  }

  async findByPhone(phone: string) {
    return await this.driversRepository.findOne({ where: { phone } });
  }

  async create(payload: CreateDriverDto) {
    // Check if driver with this phone already exists
    const existingDriver = await this.findByPhone(payload.phone);
    if (existingDriver) {
      throw new BadRequestException(`Driver with phone ${payload.phone} already exists`);
    }

    const driver = this.driversRepository.create({
      name: payload.name,
      phone: payload.phone,
      vehicleType: payload.vehicleType,
      capacity: payload.capacity ?? 0,
      online: false,
      status: 'offline',
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      homeAddress: payload.homeAddress ?? null,
      homeAddressLatitude: payload.homeAddressLatitude ?? null,
      homeAddressLongitude: payload.homeAddressLongitude ?? null,
      zoneId: payload.zoneId ?? null
    });

    return await this.driversRepository.save(driver);
  }

  /**
   * Get enriched profile data with all fields expected by frontend
   * Includes mock values for fields not in database
   */
  async getProfile(driverId: string): Promise<DriverProfileResponseDto> {
    const driver = await this.findById(driverId);
    
    // Debug: Verify actual database value with raw query to compare with TypeORM entity
    try {
      const rawDriver = await this.dataSource.query(
        `SELECT id, phone, is_verified, is_active FROM drivers WHERE id = $1`,
        [driverId]
      );
      if (rawDriver && rawDriver.length > 0) {
        console.log(`[getProfile] 🔍 Raw DB query result:`, {
          id: rawDriver[0].id,
          phone: rawDriver[0].phone,
          is_verified: rawDriver[0].is_verified,
          is_active: rawDriver[0].is_active
        });
      }
    } catch (error) {
      console.error(`[getProfile] Error querying raw DB:`, error);
    }
    
    // Debug: Log TypeORM entity values
    console.log(`[getProfile] Driver ${driverId} - phone: ${driver.phone}, createdAt:`, driver.createdAt, typeof driver.createdAt);
    console.log(`[getProfile] Driver ${driverId} - TypeORM entity - isActive: ${driver.isActive} (${typeof driver.isActive}), isVerified: ${driver.isVerified} (${typeof driver.isVerified})`);
    console.log(`[getProfile] Driver ${driverId} - Raw entity values:`, JSON.stringify({ id: driver.id, phone: driver.phone, isActive: driver.isActive, isVerified: driver.isVerified }));
    
    // Fetch wallet balance from database
    let walletBalance: number | null = null;
    try {
      const wallet = await this.walletRepository.findOne({ where: { driverId } });
      if (wallet) {
        walletBalance = parseFloat(wallet.balance.toString());
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      // Continue with null balance, will use default in DTO
    }
    
    // Calculate order counts from database
    let orderCounts: { total: number; today: number; thisWeek: number } | null = null;
    try {
      const now = new Date();
      
      // Start of today (00:00:00)
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Start of this week (Monday 00:00:00)
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Count total orders for this driver
      const totalCount = await this.ordersRepository.count({
        where: { driverId }
      });
      
      // Count today's orders
      const todayCount = await this.ordersRepository.count({
        where: {
          driverId,
          createdAt: MoreThanOrEqual(startOfToday)
        }
      });
      
      // Count this week's orders
      const thisWeekCount = await this.ordersRepository.count({
        where: {
          driverId,
          createdAt: MoreThanOrEqual(startOfWeek)
        }
      });
      
      orderCounts = {
        total: totalCount,
        today: todayCount,
        thisWeek: thisWeekCount
      };
    } catch (error) {
      console.error('Error calculating order counts:', error);
      // Continue with null order counts, will use defaults in DTO
    }
    
    return DriverProfileResponseDto.fromDriverEntity(driver, walletBalance, orderCounts);
  }

  async update(driverId: string, payload: UpdateDriverDto) {
    const driver = await this.findById(driverId);
    
    // Handle metadata separately
    const { metadata, ...driverFields } = payload;
    
    // Update driver entity fields
    Object.assign(driver, driverFields);
    
    // Update metadata if provided
    if (metadata) {
      driver.metadata = { ...(driver.metadata || {}), ...metadata };
    }
    
    return this.driversRepository.save(driver);
  }

  async updatePresence(driverId: string, latitude: number, longitude: number) {
    const driver = await this.findById(driverId);
    driver.latitude = latitude;
    driver.longitude = longitude;
    driver.lastSeenAt = new Date();
    return this.driversRepository.save(driver);
  }

  async updateMetadata(driverId: string, metadata: Record<string, unknown>) {
    const driver = await this.findById(driverId);
    driver.metadata = { ...(driver.metadata || {}), ...metadata };
    return this.driversRepository.save(driver);
  }

  async getBankAccountsByDriverId(driverId: string): Promise<DriverBankAccountEntity[]> {
    return await this.bankAccountRepository.find({
      where: { driverId },
      order: { createdAt: 'DESC' }
    });
  }

  async getBankAccountsForWithdrawMethods(driverId: string) {
    const bankAccounts = await this.getBankAccountsByDriverId(driverId);
    
    // Get default bank account ID from driver metadata
    const driver = await this.findById(driverId);
    const defaultBankAccountId = (driver.metadata as any)?.defaultBankAccountId;
    
    // Sort accounts: default first, then by creation date
    const sortedAccounts = [...bankAccounts].sort((a, b) => {
      if (defaultBankAccountId) {
        if (a.id === defaultBankAccountId) return -1;
        if (b.id === defaultBankAccountId) return 1;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    
    // Map bank accounts to Flutter-expected withdraw method format
    return sortedAccounts.map((account, index) => {
      // Create method_fields based on bank account data
      const methodFields = [
        {
          input_type: 'text',
          input_name: 'account_holder_name',
          placeholder: 'Account Holder Name',
          is_required: 1,
          value: account.accountHolderName
        },
        {
          input_type: 'text',
          input_name: 'account_number',
          placeholder: 'Account Number',
          is_required: 1,
          value: account.accountNumber
        },
        {
          input_type: 'text',
          input_name: 'ifsc_code',
          placeholder: 'IFSC Code',
          is_required: 1,
          value: account.ifscCode
        },
        {
          input_type: 'text',
          input_name: 'bank_name',
          placeholder: 'Bank Name',
          is_required: 1,
          value: account.bankName
        },
        {
          input_type: 'text',
          input_name: 'branch_name',
          placeholder: 'Branch Name',
          is_required: 0,
          value: account.branchName || ''
        },
        {
          input_type: 'text',
          input_name: 'upi_id',
          placeholder: 'UPI ID (Optional)',
          is_required: 0,
          value: account.upiId || ''
        }
      ];

      return {
        id: index + 1, // Sequential ID for Flutter compatibility
        bank_account_id: account.id, // Actual bank account UUID
        method_name: `${account.bankName} - ${account.accountNumber.substring(account.accountNumber.length - 4)}`,
        method_fields: methodFields,
        is_default: (defaultBankAccountId && account.id === defaultBankAccountId) || (!defaultBankAccountId && index === 0) ? 1 : 0,
        is_active: account.isVerified ? 1 : 0,
        created_at: account.createdAt.toISOString(),
        updated_at: account.updatedAt.toISOString()
      };
    });
  }

  async createBankAccount(driverId: string, data: {
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    bank_name: string;
    branch_name?: string;
    upi_id?: string;
  }): Promise<DriverBankAccountEntity> {
    const bankAccount = this.bankAccountRepository.create({
      driverId,
      accountHolderName: data.account_holder_name,
      accountNumber: data.account_number,
      ifscCode: data.ifsc_code,
      bankName: data.bank_name,
      branchName: data.branch_name || null,
      upiId: data.upi_id || null,
      isVerified: false
    });
    
    return await this.bankAccountRepository.save(bankAccount);
  }

  async setDefaultBankAccount(driverId: string, bankAccountId: string): Promise<void> {
    // Get all bank accounts for this driver
    const allAccounts = await this.getBankAccountsByDriverId(driverId);
    
    // Find the account to make default
    const accountToMakeDefault = allAccounts.find(acc => acc.id === bankAccountId);
    if (!accountToMakeDefault) {
      throw new NotFoundException(`Bank account ${bankAccountId} not found for driver ${driverId}`);
    }
    
    // Store the default bank account ID in driver metadata
    await this.updateMetadata(driverId, { defaultBankAccountId: bankAccountId });
  }

  async deleteBankAccount(driverId: string, bankAccountId: string): Promise<void> {
    // Get all bank accounts for this driver
    const allAccounts = await this.getBankAccountsByDriverId(driverId);
    
    // Find the account to delete
    const accountToDelete = allAccounts.find(acc => acc.id === bankAccountId);
    if (!accountToDelete) {
      throw new NotFoundException(`Bank account ${bankAccountId} not found for driver ${driverId}`);
    }
    
    // Check if this is the default account
    const driver = await this.findById(driverId);
    const defaultBankAccountId = (driver.metadata as any)?.defaultBankAccountId;
    
    // Delete the bank account
    await this.bankAccountRepository.remove(accountToDelete);
    
    // If this was the default account, clear the default from metadata
    if (defaultBankAccountId === bankAccountId) {
      const updatedMetadata = { ...(driver.metadata || {}) };
      delete updatedMetadata.defaultBankAccountId;
      await this.updateMetadata(driverId, updatedMetadata);
    }
  }

  /**
   * Creates a new driver and all associated rows in related tables
   * Called after successful login, so phone number is guaranteed to be available
   * 
   * @param phone - Phone number (required, available after login)
   * @param driverData - Optional driver data to update/create
   * @param options - Optional configuration for creating associated records
   * @returns Created/updated driver with all associated records
   */
  async newDriverFunc(
    phone: string,
    driverData?: {
      name?: string;
      vehicleType?: string;
      capacity?: number;
      latitude?: number;
      longitude?: number;
      homeAddress?: string;
      homeAddressLatitude?: number;
      homeAddressLongitude?: number;
      zoneId?: string;
    },
    options?: {
      bankAccount?: {
        account_holder_name: string;
        account_number: string;
        ifsc_code: string;
        bank_name: string;
        branch_name?: string;
        upi_id?: string;
      };
      initialWalletBalance?: number;
      currency?: string;
    }
  ): Promise<{
    driver: DriverEntity;
    wallet: DriverWalletEntity;
    bankAccount?: DriverBankAccountEntity;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Find existing driver by phone (may have been created during OTP verification)
      let driver = await queryRunner.manager.findOne(DriverEntity, {
        where: { phone }
      });

      // Try phone variations if not found
      if (!driver) {
        const phoneVariations = [
          phone,
          phone.replace('+91', '').replace(/-/g, ''),
          phone.replace('+', ''),
          `+91${phone.replace('+91', '').replace(/-/g, '')}`,
          `91${phone.replace('+91', '').replace(/-/g, '')}`
        ];
        
        for (const phoneVar of phoneVariations) {
          if (phoneVar !== phone) {
            driver = await queryRunner.manager.findOne(DriverEntity, {
              where: { phone: phoneVar }
            });
            if (driver) break;
          }
        }
      }

      // 2. Create or update driver
      if (driver) {
        // Verify actual database value with raw query to compare with TypeORM entity
        try {
          const rawDriver = await queryRunner.manager.query(
            `SELECT id, phone, is_verified, is_active FROM drivers WHERE id = $1`,
            [driver.id]
          );
          if (rawDriver && rawDriver.length > 0) {
            console.log(`[newDriverFunc] 🔍 Raw DB query result for driver ${driver.id}:`, {
              id: rawDriver[0].id,
              phone: rawDriver[0].phone,
              is_verified: rawDriver[0].is_verified,
              is_active: rawDriver[0].is_active
            });
            // Use the actual database value if TypeORM entity has a different value
            if (rawDriver[0].is_verified !== driver.isVerified) {
              console.log(`[newDriverFunc] ⚠️  Mismatch detected! DB has is_verified=${rawDriver[0].is_verified}, but entity has isVerified=${driver.isVerified}. Using DB value.`);
              driver.isVerified = rawDriver[0].is_verified;
            }
          }
        } catch (error) {
          console.error(`[newDriverFunc] Error querying raw DB:`, error);
        }
        
        // Log current isVerified value before any changes
        console.log(`[newDriverFunc] Found existing driver ${driver.id}, current isVerified=${driver.isVerified}, isActive=${driver.isActive}`);
        
        // Update existing driver with provided data
        if (driverData) {
          if (driverData.name) driver.name = driverData.name;
          if (driverData.vehicleType) driver.vehicleType = driverData.vehicleType;
          if (driverData.capacity !== undefined) driver.capacity = driverData.capacity;
          if (driverData.latitude !== undefined) driver.latitude = driverData.latitude;
          if (driverData.longitude !== undefined) driver.longitude = driverData.longitude;
          if (driverData.homeAddress !== undefined) driver.homeAddress = driverData.homeAddress;
          if (driverData.homeAddressLatitude !== undefined) driver.homeAddressLatitude = driverData.homeAddressLatitude;
          if (driverData.homeAddressLongitude !== undefined) driver.homeAddressLongitude = driverData.homeAddressLongitude;
          if (driverData.zoneId !== undefined) driver.zoneId = driverData.zoneId;
        }
        driver.isActive = true;
        // DO NOT automatically set isVerified = true here - verification status should only be set
        // when driver actually completes registration/verification process, not just by logging in
        // driver.isVerified should remain as it is in the database
        console.log(`[newDriverFunc] Saving driver ${driver.id} with isVerified=${driver.isVerified} (preserved from DB), isActive=${driver.isActive}`);
        driver = await queryRunner.manager.save(DriverEntity, driver);
        console.log(`[newDriverFunc] Saved driver ${driver.id}, final isVerified=${driver.isVerified}, isActive=${driver.isActive}`);
      } else {
        // Create new driver - use phone as name fallback if name not provided
        const driverName = driverData?.name?.trim() || phone;
        
        driver = queryRunner.manager.create(DriverEntity, {
          phone,
          name: driverName,
          vehicleType: driverData?.vehicleType || 'unknown',
          capacity: driverData?.capacity ?? 1,
          online: false,
          status: 'offline',
          latitude: driverData?.latitude ?? null,
          longitude: driverData?.longitude ?? null,
          homeAddress: driverData?.homeAddress ?? null,
          homeAddressLatitude: driverData?.homeAddressLatitude ?? null,
          homeAddressLongitude: driverData?.homeAddressLongitude ?? null,
          zoneId: driverData?.zoneId ?? null,
          isVerified: false,
          isActive: true
        });

        driver = await queryRunner.manager.save(DriverEntity, driver);
      }

      // 3. Create or get wallet
      let wallet = await queryRunner.manager.findOne(DriverWalletEntity, {
        where: { driverId: driver.id }
      });

      if (!wallet) {
        wallet = queryRunner.manager.create(DriverWalletEntity, {
          driverId: driver.id,
          balance: options?.initialWalletBalance ?? 0,
          currency: options?.currency ?? 'INR'
        });
        wallet = await queryRunner.manager.save(DriverWalletEntity, wallet);
      } else if (options?.initialWalletBalance !== undefined) {
        // Update balance if initial balance is provided
        wallet.balance = options.initialWalletBalance;
        wallet = await queryRunner.manager.save(DriverWalletEntity, wallet);
      }

      // 4. Create bank account if provided
      let savedBankAccount: DriverBankAccountEntity | undefined;
      if (options?.bankAccount) {
        // Check if bank account already exists for this driver
        const existingBankAccount = await queryRunner.manager.findOne(DriverBankAccountEntity, {
          where: {
            driverId: driver.id,
            accountNumber: options.bankAccount.account_number
          }
        });

        if (!existingBankAccount) {
          const bankAccount = queryRunner.manager.create(DriverBankAccountEntity, {
            driverId: driver.id,
            accountHolderName: options.bankAccount.account_holder_name,
            accountNumber: options.bankAccount.account_number,
            ifscCode: options.bankAccount.ifsc_code,
            bankName: options.bankAccount.bank_name,
            branchName: options.bankAccount.branch_name || null,
            upiId: options.bankAccount.upi_id || null,
            isVerified: false
          });

          savedBankAccount = await queryRunner.manager.save(DriverBankAccountEntity, bankAccount);
        } else {
          savedBankAccount = existingBankAccount;
        }
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      return {
        driver,
        wallet,
        bankAccount: savedBankAccount
      };
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }
}


