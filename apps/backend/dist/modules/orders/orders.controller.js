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
import { Body, Controller, Get, Param, Post, Put, Query, Request } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { AssignOrderDto } from './dto/assign-order.dto.js';
import { OrdersService } from './orders.service.js';
import { UpsertOrderDto } from './dto/upsert-order.dto.js';
import { DriversService } from '../drivers/drivers.service.js';
let OrdersController = class OrdersController {
    ordersService;
    driversService;
    constructor(ordersService, driversService) {
        this.ordersService = ordersService;
        this.driversService = driversService;
    }
    async list(pagination) {
        return this.ordersService.listOrders(pagination);
    }
    async getActiveByDriver(driverId, req) {
        try {
            let actualDriverId = driverId;
            if (!actualDriverId || actualDriverId === 'demo-driver-id') {
                actualDriverId = req?.user?.sub || req?.user?.driverId;
            }
            if (!actualDriverId || actualDriverId === 'demo-driver-id') {
                const phone = req?.user?.phone;
                if (phone) {
                    try {
                        const phoneVariations = [
                            phone,
                            phone.replace('+91', '').replace(/-/g, ''),
                            phone.replace('+', ''),
                            `+91${phone.replace('+91', '').replace(/-/g, '')}`,
                            `91${phone.replace('+91', '').replace(/-/g, '')}`
                        ];
                        for (const phoneVar of phoneVariations) {
                            const driver = await this.driversService.findByPhone(phoneVar);
                            if (driver) {
                                actualDriverId = driver.id;
                                break;
                            }
                        }
                    }
                    catch (e) {
                        console.warn('getActiveByDriver: Failed to lookup driver by phone:', e);
                    }
                }
            }
            if (!actualDriverId) {
                console.warn('getActiveByDriver: No valid driver ID found');
                return [];
            }
            console.log(`getActiveByDriver: Fetching active orders for driverId: ${actualDriverId}`);
            const orders = await this.ordersService.getActiveOrdersByDriver(actualDriverId);
            console.log(`getActiveByDriver: Found ${orders.length} active orders`);
            return orders;
        }
        catch (error) {
            console.error('getActiveByDriver error:', error);
            return [];
        }
    }
    async getAvailable(query, req) {
        let driverId = query.driverId || req?.user?.sub || req?.user?.driverId;
        if (!driverId || driverId === 'demo-driver-id') {
            const phone = req?.user?.phone;
            if (phone) {
                try {
                    const phoneVariations = [
                        phone,
                        phone.replace('+91', '').replace(/-/g, ''),
                        phone.replace('+', ''),
                        `+91${phone.replace('+91', '').replace(/-/g, '')}`,
                        `91${phone.replace('+91', '').replace(/-/g, '')}`
                    ];
                    for (const phoneVar of phoneVariations) {
                        const driver = await this.driversService.findByPhone(phoneVar);
                        if (driver) {
                            driverId = driver.id;
                            break;
                        }
                    }
                }
                catch (e) {
                    console.warn('getAvailable: Failed to lookup driver by phone:', e);
                }
            }
        }
        return this.ordersService.getAvailableOrders(driverId);
    }
    async getById(id) {
        return this.ordersService.findById(id);
    }
    async getSla(id) {
        const o = await this.ordersService.findById(id);
        const started = o.assignedAt ?? o.createdAt;
        const due = o.slaSeconds ? new Date(new Date(started).getTime() + o.slaSeconds * 1000) : null;
        const remainingSeconds = due ? Math.max(0, Math.floor((due.getTime() - Date.now()) / 1000)) : null;
        return { dueAt: due?.toISOString() ?? null, remainingSeconds };
    }
    async create(payload) {
        return this.ordersService.create(payload);
    }
    async upsert(id, payload) {
        return this.ordersService.upsert(id, payload);
    }
    async assign(id, payload) {
        return this.ordersService.assignDriver(id, payload.driverId);
    }
    async updateStatus(id, body, req) {
        return this.ordersService.updateStatus(id, body.status);
    }
};
__decorate([
    Get(),
    Roles('admin', 'dispatcher', 'support'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "list", null);
__decorate([
    Get('driver/:driverId/active'),
    UseGuards(JwtAuthGuard),
    __param(0, Param('driverId')),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getActiveByDriver", null);
__decorate([
    Get('available'),
    UseGuards(JwtAuthGuard),
    __param(0, Query()),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getAvailable", null);
__decorate([
    Get(':id'),
    Roles('admin', 'dispatcher', 'support'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getById", null);
__decorate([
    Get(':id/sla'),
    Roles('admin', 'dispatcher', 'support'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getSla", null);
__decorate([
    Post(),
    Roles('admin', 'dispatcher'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpsertOrderDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "create", null);
__decorate([
    Put(':id'),
    Roles('admin', 'dispatcher'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpsertOrderDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "upsert", null);
__decorate([
    Put(':id/assign'),
    Roles('admin', 'dispatcher'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AssignOrderDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "assign", null);
__decorate([
    Put(':id/status'),
    UseGuards(JwtAuthGuard),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateStatus", null);
OrdersController = __decorate([
    Controller('orders'),
    __metadata("design:paramtypes", [OrdersService,
        DriversService])
], OrdersController);
export { OrdersController };
