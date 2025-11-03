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
import { Body, Controller, Get, Param, Patch, Query, Request, HttpException, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { DriversService } from './drivers.service.js';
import { UpdateDriverDto } from './dto/update-driver.dto.js';
let DriversController = class DriversController {
    driversService;
    constructor(driversService) {
        this.driversService = driversService;
    }
    async list(pagination) {
        return this.driversService.listDrivers(pagination);
    }
    async getMe(req) {
        const driverId = req.user?.sub || req.user?.driverId;
        const isDemoAccount = req.user?.driverId === 'demo-driver-id';
        if (isDemoAccount) {
            const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
            for (const phone of demoPhones) {
                const demoDriver = await this.driversService.findByPhone(phone);
                if (demoDriver) {
                    return this.driversService.getProfile(demoDriver.id);
                }
            }
        }
        return this.driversService.getProfile(driverId);
    }
    async getById(id) {
        return this.driversService.findById(id);
    }
    async update(id, payload, req) {
        const driverId = req.user?.sub || req.user?.driverId;
        const isDemoAccount = req.user?.phone === '9975008124' || req.user?.phone === '+919975008124' || req.user?.driverId === 'demo-driver-id';
        if (!isDemoAccount && driverId !== id) {
            throw new Error('Unauthorized');
        }
        return this.driversService.update(id, payload);
    }
    async updateCapacity(id, body, req) {
        const driverId = req.user?.sub || req.user?.driverId;
        const isDemoAccount = req.user?.phone === '9975008124' || req.user?.phone === '+919975008124' || req.user?.driverId === 'demo-driver-id';
        if (!isDemoAccount && driverId !== id) {
            throw new Error('Unauthorized');
        }
        return this.driversService.update(id, { capacity: body.capacity });
    }
    async updateOnlineStatus(id, body, req) {
        try {
            const driverId = req.user?.sub || req.user?.driverId;
            const isDemoAccount = req.user?.phone === '9975008124' || req.user?.phone === '+919975008124' || req.user?.driverId === 'demo-driver-id';
            let actualDriverId;
            const isParamUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            const isTokenDriverIdUuid = driverId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(driverId) : false;
            if (!isParamUuid) {
                const phoneToUse = req.user?.phone || (isDemoAccount ? '+919975008124' : null);
                if (phoneToUse) {
                    const phoneVariations = [
                        phoneToUse,
                        phoneToUse.replace('+91', '').replace(/-/g, ''),
                        phoneToUse.replace('+', ''),
                        `+91${phoneToUse.replace('+91', '').replace(/-/g, '')}`,
                        `91${phoneToUse.replace('+91', '').replace(/-/g, '')}`
                    ];
                    let foundDriver = null;
                    for (const phone of phoneVariations) {
                        foundDriver = await this.driversService.findByPhone(phone);
                        if (foundDriver) {
                            actualDriverId = foundDriver.id;
                            break;
                        }
                    }
                    if (!foundDriver) {
                        if (driverId && isTokenDriverIdUuid) {
                            actualDriverId = driverId;
                        }
                        else {
                            throw new NotFoundException(`Driver not found for phone: ${phoneToUse}`);
                        }
                    }
                }
                else {
                    if (driverId && isTokenDriverIdUuid) {
                        actualDriverId = driverId;
                    }
                    else {
                        throw new NotFoundException('Unable to determine driver ID - phone not available');
                    }
                }
            }
            else {
                actualDriverId = id;
            }
            if (!isDemoAccount && driverId && driverId !== actualDriverId) {
                throw new HttpException('Unauthorized to update this driver', HttpStatus.FORBIDDEN);
            }
            if (typeof body.online !== 'boolean') {
                throw new BadRequestException('Invalid online status: must be a boolean');
            }
            const updatedDriver = await this.driversService.update(actualDriverId, { online: body.online });
            return {
                message: body.online ? 'You are now online' : 'You are now offline',
                online: updatedDriver.online,
                active: updatedDriver.online ? 1 : 0
            };
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('Error updating driver online status:', error);
            throw new HttpException(`Failed to update online status: ${error.message || 'Internal server error'}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "list", null);
__decorate([
    Get('me'),
    UseGuards(JwtAuthGuard),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "getMe", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "getById", null);
__decorate([
    Patch(':id'),
    UseGuards(JwtAuthGuard),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateDriverDto, Object]),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "update", null);
__decorate([
    Patch(':id/capacity'),
    UseGuards(JwtAuthGuard),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "updateCapacity", null);
__decorate([
    Patch(':id/online'),
    UseGuards(JwtAuthGuard),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "updateOnlineStatus", null);
DriversController = __decorate([
    Controller('drivers'),
    __metadata("design:paramtypes", [DriversService])
], DriversController);
export { DriversController };
