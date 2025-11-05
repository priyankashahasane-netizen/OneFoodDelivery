var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Post, Query, Request, UseGuards, UnauthorizedException, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { OrdersService } from '../orders/orders.service.js';
import { DriversService } from '../drivers/drivers.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import { WalletService } from '../wallet/wallet.service.js';
let DeliveryManController = class DeliveryManController {
    ordersService;
    driversService;
    shiftsService;
    walletService;
    constructor(ordersService, driversService, shiftsService, walletService) {
        this.ordersService = ordersService;
        this.driversService = driversService;
        this.shiftsService = shiftsService;
        this.walletService = walletService;
    }
    async getAllOrders(offset, limit, status, token, req) {
        try {
            let driverId = req?.user?.sub || req?.user?.driverId;
            const phone = req?.user?.phone;
            if (!driverId && token) {
                driverId = req?.user?.sub || req?.user?.driverId;
            }
            const isDemoAccount = req?.user?.driverId === 'demo-driver-id';
            if (driverId && !isDemoAccount) {
                try {
                    await this.driversService.findById(driverId);
                }
                catch (error) {
                    if (phone) {
                        const driverByPhone = await this.driversService.findByPhone(phone);
                        if (driverByPhone) {
                            driverId = driverByPhone.id;
                        }
                    }
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
            return await this.ordersService.getCompletedOrdersByDriver(driverId, {
                offset: offset ? parseInt(offset, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 10,
                status: status || 'all'
            });
        }
        catch (error) {
            return {
                orders: [],
                total_size: 0,
                limit: limit || '10',
                offset: offset || '1',
                order_count: {
                    all: 0,
                    delivered: 0,
                    canceled: 0,
                    refund_requested: 0,
                    refunded: 0,
                    refund_request_canceled: 0
                }
            };
        }
    }
    async getShift(req) {
        try {
            const driverId = req?.user?.sub || req?.user?.driverId;
            if (!driverId) {
                return [{ shift_name: '', shift_start_time: '', shift_end_time: '' }];
            }
            const shifts = await this.shiftsService.findByDriverId(driverId);
            if (shifts && shifts.length > 0) {
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
            const driver = await this.driversService.findById(driverId);
            const metadata = driver.metadata || {};
            return [{
                    shift_name: metadata.shiftName || 'Morning Shift',
                    shift_start_time: metadata.shiftStartTime || '08:00:00',
                    shift_end_time: metadata.shiftEndTime || '16:00:00'
                }];
        }
        catch (error) {
            return [{ shift_name: 'Morning Shift', shift_start_time: '08:00:00', shift_end_time: '16:00:00' }];
        }
    }
    async getNotifications(offset, limit, req) {
        return {
            notifications: [],
            total_size: 0,
            limit: limit || '10',
            offset: offset || '1'
        };
    }
    async getWalletPaymentList(req, offset, limit) {
        try {
            let driverId = req?.user?.sub || req?.user?.driverId;
            const phone = req?.user?.phone;
            const isDemoAccount = req?.user?.driverId === 'demo-driver-id';
            if (driverId && !isDemoAccount) {
                try {
                    await this.driversService.findById(driverId);
                }
                catch (error) {
                    if (phone) {
                        const driverByPhone = await this.driversService.findByPhone(phone);
                        if (driverByPhone) {
                            driverId = driverByPhone.id;
                        }
                    }
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
            const limitNum = limit ? parseInt(limit, 10) : 25;
            const offsetNum = offset ? parseInt(offset, 10) : 0;
            const result = await this.walletService.getWalletTransactions(driverId, limitNum, offsetNum);
            const bankDetailsResult = await this.walletService.getBankDetails(driverId);
            return {
                ...result,
                bank_details: bankDetailsResult.bank_details,
                bank_details_total_size: bankDetailsResult.total_size
            };
        }
        catch (error) {
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
    async getBankDetails(req) {
        try {
            let driverId = req?.user?.sub || req?.user?.driverId;
            const phone = req?.user?.phone;
            const isDemoAccount = req?.user?.driverId === 'demo-driver-id';
            if (driverId && !isDemoAccount) {
                try {
                    await this.driversService.findById(driverId);
                }
                catch (error) {
                    if (phone) {
                        const driverByPhone = await this.driversService.findByPhone(phone);
                        if (driverByPhone) {
                            driverId = driverByPhone.id;
                        }
                    }
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
            const result = await this.walletService.getBankDetails(driverId);
            return result;
        }
        catch (error) {
            return {
                bank_details: [],
                total_size: 0
            };
        }
    }
    async getWithdrawMethodList(req) {
        try {
            let driverId = req?.user?.sub || req?.user?.driverId;
            const phone = req?.user?.phone;
            const isDemoAccount = req?.user?.driverId === 'demo-driver-id';
            if (driverId && !isDemoAccount) {
                try {
                    await this.driversService.findById(driverId);
                }
                catch (error) {
                    if (phone) {
                        const driverByPhone = await this.driversService.findByPhone(phone);
                        if (driverByPhone) {
                            driverId = driverByPhone.id;
                        }
                    }
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
            const withdrawMethods = await this.driversService.getBankAccountsForWithdrawMethods(driverId);
            return {
                withdraw_methods: withdrawMethods,
                total_size: withdrawMethods.length
            };
        }
        catch (error) {
            return {
                withdraw_methods: [],
                total_size: 0
            };
        }
    }
    async getMessageList(offset, limit, type, req) {
        return {
            conversations: [],
            total_size: 0,
            limit: limit || '10',
            offset: offset || '1',
            type: type || 'customer'
        };
    }
    async getOrderDetails(orderId, req) {
        try {
            let driverId = req?.user?.sub || req?.user?.driverId;
            const phone = req?.user?.phone;
            const isDemoAccount = req?.user?.driverId === 'demo-driver-id';
            if (driverId && !isDemoAccount) {
                try {
                    await this.driversService.findById(driverId);
                }
                catch (error) {
                    if (phone) {
                        const driverByPhone = await this.driversService.findByPhone(phone);
                        if (driverByPhone) {
                            driverId = driverByPhone.id;
                        }
                    }
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
            return await this.ordersService.findByIdForDriver(orderId, driverId);
        }
        catch (error) {
            throw error;
        }
    }
    async makeWalletAdjustment(req) {
        try {
            let driverId = req?.user?.sub || req?.user?.driverId;
            const phone = req?.user?.phone;
            const isDemoAccount = req?.user?.driverId === 'demo-driver-id';
            if (driverId && !isDemoAccount) {
                try {
                    await this.driversService.findById(driverId);
                }
                catch (error) {
                    if (phone) {
                        const driverByPhone = await this.driversService.findByPhone(phone);
                        if (driverByPhone) {
                            driverId = driverByPhone.id;
                        }
                    }
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
            const result = await this.walletService.adjustWalletToZero(driverId);
            return {
                message: result.message,
                success: result.success
            };
        }
        catch (error) {
            throw error;
        }
    }
};
__decorate([
    Get('all-orders'),
    UseGuards(JwtAuthGuard),
    __param(0, Query('offset')),
    __param(1, Query('limit')),
    __param(2, Query('status')),
    __param(3, Query('token')),
    __param(4, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], DeliveryManController.prototype, "getAllOrders", null);
__decorate([
    Get('dm-shift'),
    UseGuards(JwtAuthGuard),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeliveryManController.prototype, "getShift", null);
__decorate([
    Get('notifications'),
    UseGuards(JwtAuthGuard),
    __param(0, Query('offset')),
    __param(1, Query('limit')),
    __param(2, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DeliveryManController.prototype, "getNotifications", null);
__decorate([
    Get('wallet-payment-list'),
    UseGuards(JwtAuthGuard),
    __param(0, Request()),
    __param(1, Query('offset')),
    __param(2, Query('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], DeliveryManController.prototype, "getWalletPaymentList", null);
__decorate([
    Get('bank-details'),
    UseGuards(JwtAuthGuard),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeliveryManController.prototype, "getBankDetails", null);
__decorate([
    Get('get-withdraw-method-list'),
    UseGuards(JwtAuthGuard),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeliveryManController.prototype, "getWithdrawMethodList", null);
__decorate([
    Get('message/list'),
    UseGuards(JwtAuthGuard),
    __param(0, Query('offset')),
    __param(1, Query('limit')),
    __param(2, Query('type')),
    __param(3, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], DeliveryManController.prototype, "getMessageList", null);
__decorate([
    Get('order/:orderId'),
    UseGuards(JwtAuthGuard),
    __param(0, Param('orderId')),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DeliveryManController.prototype, "getOrderDetails", null);
__decorate([
    Post('make-wallet-adjustment'),
    UseGuards(JwtAuthGuard),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeliveryManController.prototype, "makeWalletAdjustment", null);
DeliveryManController = __decorate([
    Controller('v1/delivery-man'),
    __metadata("design:paramtypes", [OrdersService,
        DriversService,
        ShiftsService,
        WalletService])
], DeliveryManController);
export { DeliveryManController };
