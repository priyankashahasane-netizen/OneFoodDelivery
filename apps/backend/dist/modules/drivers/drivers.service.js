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
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverEntity } from './entities/driver.entity.js';
import { DriverProfileResponseDto } from './dto/driver-profile-response.dto.js';
let DriversService = class DriversService {
    driversRepository;
    constructor(driversRepository) {
        this.driversRepository = driversRepository;
    }
    async listDrivers(pagination) {
        const { page = 1, pageSize = 25 } = pagination;
        const [items, total] = await this.driversRepository.findAndCount({
            take: pageSize,
            skip: (page - 1) * pageSize,
            order: { updatedAt: 'DESC' }
        });
        return { items, total, page, pageSize };
    }
    async findById(driverId) {
        const driver = await this.driversRepository.findOne({ where: { id: driverId } });
        if (!driver) {
            throw new NotFoundException(`Driver ${driverId} not found`);
        }
        return driver;
    }
    async findByPhone(phone) {
        return await this.driversRepository.findOne({ where: { phone } });
    }
    async getProfile(driverId) {
        const driver = await this.findById(driverId);
        return DriverProfileResponseDto.fromDriverEntity(driver);
    }
    async update(driverId, payload) {
        const driver = await this.findById(driverId);
        Object.assign(driver, payload);
        return this.driversRepository.save(driver);
    }
    async updatePresence(driverId, latitude, longitude) {
        const driver = await this.findById(driverId);
        driver.latitude = latitude;
        driver.longitude = longitude;
        driver.lastSeenAt = new Date();
        return this.driversRepository.save(driver);
    }
};
DriversService = __decorate([
    Injectable(),
    __param(0, InjectRepository(DriverEntity)),
    __metadata("design:paramtypes", [Repository])
], DriversService);
export { DriversService };
