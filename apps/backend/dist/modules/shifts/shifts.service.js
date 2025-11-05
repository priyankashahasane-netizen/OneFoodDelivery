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
import { ShiftEntity } from './entities/shift.entity.js';
let ShiftsService = class ShiftsService {
    shiftRepository;
    constructor(shiftRepository) {
        this.shiftRepository = shiftRepository;
    }
    async findAll() {
        return await this.shiftRepository.find({
            where: { status: 1 },
            order: { startTime: 'ASC' }
        });
    }
    async findByDriverId(driverId) {
        if (driverId === 'demo-driver-id' || !this.isValidUUID(driverId)) {
            return await this.findAll();
        }
        try {
            return await this.shiftRepository.find({
                where: { driverId, status: 1 },
                order: { startTime: 'ASC' }
            });
        }
        catch (error) {
            return await this.findAll();
        }
    }
    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    async findByZoneId(zoneId) {
        return await this.shiftRepository.find({
            where: { zoneId, status: 1 },
            order: { startTime: 'ASC' }
        });
    }
    async findById(id) {
        const shift = await this.shiftRepository.findOne({ where: { id } });
        if (!shift) {
            throw new NotFoundException(`Shift with ID ${id} not found`);
        }
        return shift;
    }
    async create(shiftData) {
        const shift = this.shiftRepository.create(shiftData);
        return await this.shiftRepository.save(shift);
    }
    async update(id, shiftData) {
        const shift = await this.findById(id);
        Object.assign(shift, shiftData);
        return await this.shiftRepository.save(shift);
    }
    async delete(id) {
        const shift = await this.findById(id);
        shift.status = 0;
        await this.shiftRepository.save(shift);
    }
};
ShiftsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(ShiftEntity)),
    __metadata("design:paramtypes", [Repository])
], ShiftsService);
export { ShiftsService };
