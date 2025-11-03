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
import { Body, Controller, Get, Param, Put, Query, Request } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { AssignOrderDto } from '../assignments/dto/assign-order.dto.js';
import { OrdersService } from './orders.service.js';
import { UpsertOrderDto } from './dto/upsert-order.dto.js';
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async list(pagination) {
        return this.ordersService.listOrders(pagination);
    }
    async getActiveByDriver(driverId, req) {
        try {
            const actualDriverId = req?.user?.sub || req?.user?.driverId || driverId;
            if (!actualDriverId) {
                return [];
            }
            return await this.ordersService.getActiveOrdersByDriver(actualDriverId);
        }
        catch (error) {
            return [];
        }
    }
    async getAvailable(query) {
        return this.ordersService.getAvailableOrders(query.driverId);
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
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
    __metadata("design:paramtypes", [OrdersService])
], OrdersController);
export { OrdersController };
