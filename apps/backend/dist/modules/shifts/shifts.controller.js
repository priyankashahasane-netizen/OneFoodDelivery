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
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { ShiftsService } from './shifts.service.js';
let ShiftsController = class ShiftsController {
    shiftsService;
    constructor(shiftsService) {
        this.shiftsService = shiftsService;
    }
    async getAllShifts(req) {
        const driverId = req?.user?.sub || req?.user?.driverId;
        if (driverId && driverId !== 'demo-driver-id') {
            try {
                return await this.shiftsService.findByDriverId(driverId);
            }
            catch (error) {
                return await this.shiftsService.findAll();
            }
        }
        return await this.shiftsService.findAll();
    }
    async getDriverShifts(driverId) {
        if (driverId === 'demo-driver-id') {
            return await this.shiftsService.findAll();
        }
        try {
            return await this.shiftsService.findByDriverId(driverId);
        }
        catch (error) {
            return await this.shiftsService.findAll();
        }
    }
    async getShift(id) {
        return await this.shiftsService.findById(id);
    }
    async createShift(shiftData) {
        return await this.shiftsService.create(shiftData);
    }
    async updateShift(id, shiftData) {
        return await this.shiftsService.update(id, shiftData);
    }
    async deleteShift(id) {
        await this.shiftsService.delete(id);
        return { message: 'Shift deleted successfully' };
    }
};
__decorate([
    Get(),
    UseGuards(JwtAuthGuard),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "getAllShifts", null);
__decorate([
    Get('driver/:driverId'),
    UseGuards(JwtAuthGuard),
    __param(0, Param('driverId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "getDriverShifts", null);
__decorate([
    Get(':id'),
    UseGuards(JwtAuthGuard),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "getShift", null);
__decorate([
    Post(),
    UseGuards(JwtAuthGuard),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "createShift", null);
__decorate([
    Put(':id'),
    UseGuards(JwtAuthGuard),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "updateShift", null);
__decorate([
    Delete(':id'),
    UseGuards(JwtAuthGuard),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "deleteShift", null);
ShiftsController = __decorate([
    Controller('shifts'),
    __metadata("design:paramtypes", [ShiftsService])
], ShiftsController);
export { ShiftsController };
