import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';

import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { UpdateDriverDto } from './dto/update-driver.dto.js';
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
    private readonly ordersRepository: Repository<OrderEntity>
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
    const driver = await this.driversRepository.findOne({ where: { id: driverId } });
    if (!driver) {
      throw new NotFoundException(`Driver ${driverId} not found`);
    }
    return driver;
  }

  async findByPhone(phone: string) {
    return await this.driversRepository.findOne({ where: { phone } });
  }

  /**
   * Get enriched profile data with all fields expected by frontend
   * Includes mock values for fields not in database
   */
  async getProfile(driverId: string): Promise<DriverProfileResponseDto> {
    const driver = await this.findById(driverId);
    
    // Debug: Log createdAt to verify it's loaded
    console.log(`[getProfile] Driver ${driverId} - createdAt:`, driver.createdAt, typeof driver.createdAt);
    
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
    Object.assign(driver, payload);
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
    
    // Map bank accounts to Flutter-expected withdraw method format
    return bankAccounts.map((account, index) => {
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
        method_name: `${account.bankName} - ${account.accountNumber.substring(account.accountNumber.length - 4)}`,
        method_fields: methodFields,
        is_default: index === 0 ? 1 : 0, // First account as default
        is_active: account.isVerified ? 1 : 0,
        created_at: account.createdAt.toISOString(),
        updated_at: account.updatedAt.toISOString()
      };
    });
  }
}


