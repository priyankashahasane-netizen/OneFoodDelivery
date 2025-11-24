import { Controller, Get, Post, Put, Body, Query, Request, UseGuards, UnauthorizedException, Param, BadRequestException, HttpException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { OrdersService } from '../orders/orders.service.js';
import { DriversService } from '../drivers/drivers.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import { WalletService } from '../wallet/wallet.service.js';

@Controller('v1/delivery-man')
export class DeliveryManController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly driversService: DriversService,
    private readonly shiftsService: ShiftsService,
    private readonly walletService: WalletService
  ) {}

  @Get('all-orders')
  @UseGuards(JwtAuthGuard)
  async getAllOrders(
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('token') token?: string,
    @Request() req?: any
  ) {
    try {
      // Get driver ID from JWT token
      let driverId = req?.user?.sub || req?.user?.driverId;
      const phone = req?.user?.phone;

      // If no driver ID from token, try to extract from token query param (for backward compatibility)
      if (!driverId && token) {
        // Token is in Authorization header via JwtAuthGuard, but check user anyway
        driverId = req?.user?.sub || req?.user?.driverId;
      }

      // Check if driver ID is demo account placeholder
      const isDemoAccount = req?.user?.driverId === 'demo-driver-id';
      
      // If driver ID is provided (not demo), verify it exists
      if (driverId && !isDemoAccount) {
        try {
          await this.driversService.findById(driverId);
        } catch (error) {
          // Driver not found with this ID - try to resolve by phone if available
          if (phone) {
            const driverByPhone = await this.driversService.findByPhone(phone);
            if (driverByPhone) {
              driverId = driverByPhone.id;
            }
          }
          
          // If still not found, try demo phone variations
          if (!driverId || driverId === req?.user?.sub) {
            const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
            for (const demoPhone of demoPhones) {
              const demoDriver = await this.driversService.findByPhone(demoPhone);
              if (demoDriver) {
                driverId = demoDriver.id;
                break;
              }
            }
          }
        }
      }

      // Resolve demo account driver ID by phone
      if (isDemoAccount || !driverId) {
        const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
        for (const demoPhone of demoPhones) {
          const demoDriver = await this.driversService.findByPhone(demoPhone);
          if (demoDriver) {
            driverId = demoDriver.id;
            break;
          }
        }
      }

      if (!driverId) {
        throw new UnauthorizedException('Driver ID not found in token');
      }

      const statusParam = status || 'all';
      console.log(`[getAllOrders] Driver: ${driverId}, Status: ${statusParam}, Offset: ${offset}, Limit: ${limit}`);
      
      return await this.ordersService.getCompletedOrdersByDriver(driverId, {
        offset: offset ? parseInt(offset, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        status: statusParam
      });
    } catch (error) {
      // Return empty orders list on error instead of throwing
      return {
        orders: [],
        total_size: 0,
        limit: limit || '10',
        offset: offset || '1',
        order_count: {
          all: 0,
          accepted: 0,
          confirmed: 0,
          processing: 0,
          handover: 0,
          picked_up: 0,
          in_transit: 0,
          delivered: 0,
          cancelled: 0,
          refund_requested: 0,
          refunded: 0,
          refund_request_cancelled: 0
        }
      };
    }
  }

  @Get('dm-shift')
  @UseGuards(JwtAuthGuard)
  async getShift(@Request() req: any) {
    try {
      const driverId = req?.user?.sub || req?.user?.driverId;
      if (!driverId) {
        // Return list format for compatibility
        return [{ shift_name: '', shift_start_time: '', shift_end_time: '' }];
      }
      
      // Try to get shifts from database first
      const shifts = await this.shiftsService.findByDriverId(driverId);
      if (shifts && shifts.length > 0) {
        // Return list of shifts in the expected format
        return shifts.map(shift => ({
          id: shift.id,
          name: shift.name,
          shift_name: shift.name,
          start_time: shift.startTime,
          shift_start_time: shift.startTime,
          end_time: shift.endTime,
          shift_end_time: shift.endTime,
          status: shift.status,
          created_at: shift.createdAt,
          updated_at: shift.updatedAt
        }));
      }
      
      // If no driver-specific shifts, get all available shifts
      const allShifts = await this.shiftsService.findAll();
      if (allShifts && allShifts.length > 0) {
        return allShifts.map(shift => ({
          id: shift.id,
          name: shift.name,
          shift_name: shift.name,
          start_time: shift.startTime,
          shift_start_time: shift.startTime,
          end_time: shift.endTime,
          shift_end_time: shift.endTime,
          status: shift.status,
          created_at: shift.createdAt,
          updated_at: shift.updatedAt
        }));
      }
      
      // Fallback to driver metadata if no shift found in database
      const driver = await this.driversService.findById(driverId);
      const metadata = driver.metadata || {};
      return [{
        shift_name: metadata.shiftName || 'Morning Shift',
        shift_start_time: metadata.shiftStartTime || '08:00:00',
        shift_end_time: metadata.shiftEndTime || '16:00:00'
      }];
    } catch (error) {
      // Return default shift if driver not found or any error
      return [{ shift_name: 'Morning Shift', shift_start_time: '08:00:00', shift_end_time: '16:00:00' }];
    }
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  async getNotifications(
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Request() req?: any
  ) {
    // Return empty notifications list for now
    return {
      notifications: [],
      total_size: 0,
      limit: limit || '10',
      offset: offset || '1'
    };
  }

  @Get('wallet-payment-list')
  @UseGuards(JwtAuthGuard)
  async getWalletPaymentList(
    @Request() req: any,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string
  ) {
    try {
      // Get driver ID from JWT token
      let driverId = req?.user?.sub || req?.user?.driverId;
      const phone = req?.user?.phone;

      // Check if driver ID is demo account placeholder
      const isDemoAccount = req?.user?.driverId === 'demo-driver-id';

      // If driver ID is provided (not demo), verify it exists
      if (driverId && !isDemoAccount) {
        try {
          await this.driversService.findById(driverId);
        } catch (error) {
          // Driver not found with this ID - try to resolve by phone if available
          if (phone) {
            const driverByPhone = await this.driversService.findByPhone(phone);
            if (driverByPhone) {
              driverId = driverByPhone.id;
            }
          }

          // If still not found, try demo phone variations
          if (!driverId || driverId === req?.user?.sub) {
            const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
            for (const demoPhone of demoPhones) {
              const demoDriver = await this.driversService.findByPhone(demoPhone);
              if (demoDriver) {
                driverId = demoDriver.id;
                break;
              }
            }
          }
        }
      }

      // Resolve demo account driver ID by phone
      if (isDemoAccount || !driverId) {
        const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
        for (const demoPhone of demoPhones) {
          const demoDriver = await this.driversService.findByPhone(demoPhone);
          if (demoDriver) {
            driverId = demoDriver.id;
            break;
          }
        }
      }

      if (!driverId) {
        return {
          transactions: [],
          total_size: 0,
          limit: limit || '25',
          offset: offset || '0',
          bank_details: [],
          bank_details_total_size: 0
        };
      }

      // Get wallet transactions
      const limitNum = limit ? parseInt(limit, 10) : 25;
      const offsetNum = offset ? parseInt(offset, 10) : 0;
      const result = await this.walletService.getWalletTransactions(driverId, limitNum, offsetNum);

      // Get bank details
      const bankDetailsResult = await this.walletService.getBankDetails(driverId);

      return {
        ...result,
        bank_details: bankDetailsResult.bank_details,
        bank_details_total_size: bankDetailsResult.total_size
      };
    } catch (error) {
      // Return empty list on error
      return {
        transactions: [],
        total_size: 0,
        limit: limit || '25',
        offset: offset || '0',
        bank_details: [],
        bank_details_total_size: 0
      };
    }
  }

  @Get('bank-details')
  @UseGuards(JwtAuthGuard)
  async getBankDetails(@Request() req: any) {
    try {
      // Get driver ID from JWT token
      let driverId = req?.user?.sub || req?.user?.driverId;
      const phone = req?.user?.phone;

      // Check if driver ID is demo account placeholder
      const isDemoAccount = req?.user?.driverId === 'demo-driver-id';

      // If driver ID is provided (not demo), verify it exists
      if (driverId && !isDemoAccount) {
        try {
          await this.driversService.findById(driverId);
        } catch (error) {
          // Driver not found with this ID - try to resolve by phone if available
          if (phone) {
            const driverByPhone = await this.driversService.findByPhone(phone);
            if (driverByPhone) {
              driverId = driverByPhone.id;
            }
          }

          // If still not found, try demo phone variations
          if (!driverId || driverId === req?.user?.sub) {
            const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
            for (const demoPhone of demoPhones) {
              const demoDriver = await this.driversService.findByPhone(demoPhone);
              if (demoDriver) {
                driverId = demoDriver.id;
                break;
              }
            }
          }
        }
      }

      // Resolve demo account driver ID by phone
      if (isDemoAccount || !driverId) {
        const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
        for (const demoPhone of demoPhones) {
          const demoDriver = await this.driversService.findByPhone(demoPhone);
          if (demoDriver) {
            driverId = demoDriver.id;
            break;
          }
        }
      }

      if (!driverId) {
        return {
          bank_details: [],
          total_size: 0
        };
      }

      // Get bank details
      const result = await this.walletService.getBankDetails(driverId);

      return result;
    } catch (error) {
      // Return empty list on error
      return {
        bank_details: [],
        total_size: 0
      };
    }
  }

  @Get('get-withdraw-method-list')
  @UseGuards(JwtAuthGuard)
  async getWithdrawMethodList(@Request() req: any) {
    try {
      // Get driver ID from JWT token
      let driverId = req?.user?.sub || req?.user?.driverId;
      const phone = req?.user?.phone;

      // Check if driver ID is demo account placeholder
      const isDemoAccount = req?.user?.driverId === 'demo-driver-id';

      // If driver ID is provided (not demo), verify it exists
      if (driverId && !isDemoAccount) {
        try {
          await this.driversService.findById(driverId);
        } catch (error) {
          // Driver not found with this ID - try to resolve by phone if available
          if (phone) {
            const driverByPhone = await this.driversService.findByPhone(phone);
            if (driverByPhone) {
              driverId = driverByPhone.id;
            }
          }

          // If still not found, try demo phone variations
          if (!driverId || driverId === req?.user?.sub) {
            const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
            for (const demoPhone of demoPhones) {
              const demoDriver = await this.driversService.findByPhone(demoPhone);
              if (demoDriver) {
                driverId = demoDriver.id;
                break;
              }
            }
          }
        }
      }

      // Resolve demo account driver ID by phone
      if (isDemoAccount || !driverId) {
        const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
        for (const demoPhone of demoPhones) {
          const demoDriver = await this.driversService.findByPhone(demoPhone);
          if (demoDriver) {
            driverId = demoDriver.id;
            break;
          }
        }
      }

      if (!driverId) {
        return {
          withdraw_methods: [],
          total_size: 0
        };
      }

      // Get bank accounts as withdraw methods
      const withdrawMethods = await this.driversService.getBankAccountsForWithdrawMethods(driverId);

      return {
        withdraw_methods: withdrawMethods,
        total_size: withdrawMethods.length
      };
    } catch (error) {
      // Return empty list on error
      return {
        withdraw_methods: [],
        total_size: 0
      };
    }
  }

  @Post('withdraw-method/delete')
  @UseGuards(JwtAuthGuard)
  async deleteWithdrawMethod(@Body() body: any, @Request() req: any) {
    try {
      // Get driver ID from JWT token
      let driverId = req?.user?.sub || req?.user?.driverId;
      const phone = req?.user?.phone;

      // Check if driver ID is demo account placeholder
      const isDemoAccount = req?.user?.driverId === 'demo-driver-id';

      // If driver ID is provided (not demo), verify it exists
      if (driverId && !isDemoAccount) {
        try {
          await this.driversService.findById(driverId);
        } catch (error) {
          // Driver not found with this ID - try to resolve by phone if available
          if (phone) {
            const driverByPhone = await this.driversService.findByPhone(phone);
            if (driverByPhone) {
              driverId = driverByPhone.id;
            }
          }

          // If still not found, try demo phone variations
          if (!driverId || driverId === req?.user?.sub) {
            const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
            for (const demoPhone of demoPhones) {
              const demoDriver = await this.driversService.findByPhone(demoPhone);
              if (demoDriver) {
                driverId = demoDriver.id;
                break;
              }
            }
          }
        }
      }

      // Resolve demo account driver ID by phone
      if (isDemoAccount || !driverId) {
        const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
        for (const demoPhone of demoPhones) {
          const demoDriver = await this.driversService.findByPhone(demoPhone);
          if (demoDriver) {
            driverId = demoDriver.id;
            break;
          }
        }
      }

      if (!driverId) {
        throw new UnauthorizedException('Driver ID not found in token');
      }

      // Get bank account ID from body
      const bankAccountId = body.bank_account_id || body.id;
      if (!bankAccountId) {
        throw new BadRequestException('Bank account ID is required');
      }

      // Delete the bank account
      await this.driversService.deleteBankAccount(driverId, bankAccountId);

      return {
        message: 'Bank account deleted successfully',
        success: true
      };
    } catch (error: any) {
      console.error('Error in deleteWithdrawMethod:', error);
      
      // If it's already an HttpException, re-throw it
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Otherwise, wrap it in a BadRequestException
      throw new BadRequestException(
        error?.message || 'Failed to delete bank account. Please try again.'
      );
    }
  }

  @Post('withdraw-method/make-default')
  @UseGuards(JwtAuthGuard)
  async makeDefaultWithdrawMethod(@Body() body: any, @Request() req: any) {
    try {
      // Get driver ID from JWT token
      let driverId = req?.user?.sub || req?.user?.driverId;
      const phone = req?.user?.phone;

      // Check if driver ID is demo account placeholder
      const isDemoAccount = req?.user?.driverId === 'demo-driver-id';

      // If driver ID is provided (not demo), verify it exists
      if (driverId && !isDemoAccount) {
        try {
          await this.driversService.findById(driverId);
        } catch (error) {
          // Driver not found with this ID - try to resolve by phone if available
          if (phone) {
            const driverByPhone = await this.driversService.findByPhone(phone);
            if (driverByPhone) {
              driverId = driverByPhone.id;
            }
          }

          // If still not found, try demo phone variations
          if (!driverId || driverId === req?.user?.sub) {
            const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
            for (const demoPhone of demoPhones) {
              const demoDriver = await this.driversService.findByPhone(demoPhone);
              if (demoDriver) {
                driverId = demoDriver.id;
                break;
              }
            }
          }
        }
      }

      // Resolve demo account driver ID by phone
      if (isDemoAccount || !driverId) {
        const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
        for (const demoPhone of demoPhones) {
          const demoDriver = await this.driversService.findByPhone(demoPhone);
          if (demoDriver) {
            driverId = demoDriver.id;
            break;
          }
        }
      }

      if (!driverId) {
        throw new UnauthorizedException('Driver ID not found in token');
      }

      // Get bank account ID from body (support both 'id' and 'bank_account_id')
      const bankAccountId = body.bank_account_id || body.id;
      if (!bankAccountId) {
        throw new BadRequestException('Bank account ID is required');
      }

      // Set as default
      await this.driversService.setDefaultBankAccount(driverId, bankAccountId);

      return {
        message: 'Bank account set as default successfully',
        success: true
      };
    } catch (error: any) {
      console.error('Error in makeDefaultWithdrawMethod:', error);
      
      // If it's already an HttpException, re-throw it
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Otherwise, wrap it in a BadRequestException
      throw new BadRequestException(
        error?.message || 'Failed to set default bank account. Please try again.'
      );
    }
  }

  @Post('withdraw-method/store')
  @UseGuards(JwtAuthGuard)
  async storeWithdrawMethod(@Body() body: any, @Request() req: any) {
    try {
      // Get driver ID from JWT token
      let driverId = req?.user?.sub || req?.user?.driverId;
      const phone = req?.user?.phone;

      // Check if driver ID is demo account placeholder
      const isDemoAccount = req?.user?.driverId === 'demo-driver-id';

      // If driver ID is provided (not demo), verify it exists
      if (driverId && !isDemoAccount) {
        try {
          await this.driversService.findById(driverId);
        } catch (error) {
          // Driver not found with this ID - try to resolve by phone if available
          if (phone) {
            const driverByPhone = await this.driversService.findByPhone(phone);
            if (driverByPhone) {
              driverId = driverByPhone.id;
            }
          }

          // If still not found, try demo phone variations
          if (!driverId || driverId === req?.user?.sub) {
            const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
            for (const demoPhone of demoPhones) {
              const demoDriver = await this.driversService.findByPhone(demoPhone);
              if (demoDriver) {
                driverId = demoDriver.id;
                break;
              }
            }
          }
        }
      }

      // Resolve demo account driver ID by phone
      if (isDemoAccount || !driverId) {
        const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
        for (const demoPhone of demoPhones) {
          const demoDriver = await this.driversService.findByPhone(demoPhone);
          if (demoDriver) {
            driverId = demoDriver.id;
            break;
          }
        }
      }

      if (!driverId) {
        throw new UnauthorizedException('Driver ID not found in token');
      }

      // Validate required fields
      if (!body.account_holder_name || !body.account_number || !body.ifsc_code || !body.bank_name) {
        throw new BadRequestException('Missing required fields: account_holder_name, account_number, ifsc_code, bank_name');
      }

      // Create bank account
      const bankAccount = await this.driversService.createBankAccount(driverId, {
        account_holder_name: body.account_holder_name,
        account_number: body.account_number,
        ifsc_code: body.ifsc_code,
        bank_name: body.bank_name,
        branch_name: body.branch_name,
        upi_id: body.upi_id
      });

      return {
        message: 'Bank account added successfully',
        success: true,
        id: bankAccount.id
      };
    } catch (error: any) {
      console.error('Error in storeWithdrawMethod:', error);
      
      // If it's already an HttpException, re-throw it
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Otherwise, wrap it in a BadRequestException
      throw new BadRequestException(
        error?.message || 'Failed to add bank account. Please try again.'
      );
    }
  }

  @Get('message/list')
  @UseGuards(JwtAuthGuard)
  async getMessageList(
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Request() req?: any
  ) {
    // Return empty message list for now
    return {
      conversations: [],
      total_size: 0,
      limit: limit || '10',
      offset: offset || '1',
      type: type || 'customer'
    };
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getOrderDetails(
    @Param('orderId') orderId: string,
    @Request() req?: any
  ) {
    try {
      // Get driver ID from JWT token
      let driverId = req?.user?.sub || req?.user?.driverId;
      const phone = req?.user?.phone;

      // Check if driver ID is demo account placeholder
      const isDemoAccount = req?.user?.driverId === 'demo-driver-id';
      
      // If driver ID is provided (not demo), verify it exists
      if (driverId && !isDemoAccount) {
        try {
          await this.driversService.findById(driverId);
        } catch (error) {
          // Driver not found with this ID - try to resolve by phone if available
          if (phone) {
            const driverByPhone = await this.driversService.findByPhone(phone);
            if (driverByPhone) {
              driverId = driverByPhone.id;
            }
          }
          
          // If still not found, try demo phone variations
          if (!driverId || driverId === req?.user?.sub) {
            const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
            for (const demoPhone of demoPhones) {
              const demoDriver = await this.driversService.findByPhone(demoPhone);
              if (demoDriver) {
                driverId = demoDriver.id;
                break;
              }
            }
          }
        }
      }

      // Resolve demo account driver ID by phone
      if (isDemoAccount || !driverId) {
        const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
        for (const demoPhone of demoPhones) {
          const demoDriver = await this.driversService.findByPhone(demoPhone);
          if (demoDriver) {
            driverId = demoDriver.id;
            break;
          }
        }
      }

      if (!driverId) {
        throw new UnauthorizedException('Driver ID not found in token');
      }

      // Get order details - service will check if order belongs to driver
      return await this.ordersService.findByIdForDriver(orderId, driverId);
    } catch (error) {
      throw error;
    }
  }

  @Post('make-wallet-adjustment')
  @UseGuards(JwtAuthGuard)
  async makeWalletAdjustment(@Request() req: any) {
    try {
      // Get driver ID from JWT token
      let driverId = req?.user?.sub || req?.user?.driverId;
      const phone = req?.user?.phone;

      // Check if driver ID is demo account placeholder
      const isDemoAccount = req?.user?.driverId === 'demo-driver-id';

      // If driver ID is provided (not demo), verify it exists
      if (driverId && !isDemoAccount) {
        try {
          await this.driversService.findById(driverId);
        } catch (error) {
          // Driver not found with this ID - try to resolve by phone if available
          if (phone) {
            const driverByPhone = await this.driversService.findByPhone(phone);
            if (driverByPhone) {
              driverId = driverByPhone.id;
            }
          }

          // If still not found, try demo phone variations
          if (!driverId || driverId === req?.user?.sub) {
            const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
            for (const demoPhone of demoPhones) {
              const demoDriver = await this.driversService.findByPhone(demoPhone);
              if (demoDriver) {
                driverId = demoDriver.id;
                break;
              }
            }
          }
        }
      }

      // Resolve demo account driver ID by phone
      if (isDemoAccount || !driverId) {
        const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
        for (const demoPhone of demoPhones) {
          const demoDriver = await this.driversService.findByPhone(demoPhone);
          if (demoDriver) {
            driverId = demoDriver.id;
            break;
          }
        }
      }

      if (!driverId) {
        throw new UnauthorizedException('Driver ID not found in token');
      }

      // Adjust wallet balance to zero
      const result = await this.walletService.adjustWalletToZero(driverId);

      return {
        message: result.message,
        success: result.success
      };
    } catch (error: any) {
      // Log the error for debugging
      console.error('Error in makeWalletAdjustment:', error);
      
      // If it's already an HttpException, re-throw it
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Otherwise, wrap it in a BadRequestException with a user-friendly message
      throw new BadRequestException(
        error?.message || 'Failed to adjust wallet balance. Please try again.'
      );
    }
  }

  @Put('update-fcm-token')
  @UseGuards(JwtAuthGuard)
  async updateFcmToken(@Body() body: { fcm_token?: string; token?: string }, @Request() req: any) {
    try {
      // Get driver ID from JWT token
      let driverId = req?.user?.sub || req?.user?.driverId;
      const phone = req?.user?.phone;
      const isDemoAccount = req?.user?.driverId === 'demo-driver-id';

      // Resolve driver ID
      if (isDemoAccount || !driverId) {
        const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
        for (const demoPhone of demoPhones) {
          const demoDriver = await this.driversService.findByPhone(demoPhone);
          if (demoDriver) {
            driverId = demoDriver.id;
            break;
          }
        }
      } else if (phone) {
        // Try to find driver by phone if UUID lookup fails
        try {
          await this.driversService.findById(driverId);
        } catch (error) {
          const driverByPhone = await this.driversService.findByPhone(phone);
          if (driverByPhone) {
            driverId = driverByPhone.id;
          }
        }
      }

      if (!driverId) {
        throw new UnauthorizedException('Driver ID not found');
      }

      // Get FCM token from body (support both fcm_token and fcmToken)
      const fcmToken = body.fcm_token || (body as any).fcmToken || '';

      if (!fcmToken || fcmToken.trim() === '') {
        return {
          message: 'FCM token is required',
          success: false
        };
      }

      // Update driver metadata with FCM token
      await this.driversService.updateMetadata(driverId, {
        fcmToken: fcmToken.trim()
      });

      return {
        message: 'FCM token updated successfully',
        success: true
      };
    } catch (error: any) {
      throw error;
    }
  }
}

