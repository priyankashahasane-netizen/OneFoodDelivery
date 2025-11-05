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
import { DriverBankAccountEntity } from './entities/driver-bank-account.entity.js';
let DriversService = class DriversService {
    driversRepository;
    bankAccountRepository;
    constructor(driversRepository, bankAccountRepository) {
        this.driversRepository = driversRepository;
        this.bankAccountRepository = bankAccountRepository;
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
    async updateMetadata(driverId, metadata) {
        const driver = await this.findById(driverId);
        driver.metadata = { ...(driver.metadata || {}), ...metadata };
        return this.driversRepository.save(driver);
    }
    async getBankAccountsByDriverId(driverId) {
        return await this.bankAccountRepository.find({
            where: { driverId },
            order: { createdAt: 'DESC' }
        });
    }
    async getBankAccountsForWithdrawMethods(driverId) {
        const bankAccounts = await this.getBankAccountsByDriverId(driverId);
        return bankAccounts.map((account, index) => {
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
                id: index + 1,
                method_name: `${account.bankName} - ${account.accountNumber.substring(account.accountNumber.length - 4)}`,
                method_fields: methodFields,
                is_default: index === 0 ? 1 : 0,
                is_active: account.isVerified ? 1 : 0,
                created_at: account.createdAt.toISOString(),
                updated_at: account.updatedAt.toISOString()
            };
        });
    }
};
DriversService = __decorate([
    Injectable(),
    __param(0, InjectRepository(DriverEntity)),
    __param(1, InjectRepository(DriverBankAccountEntity)),
    __metadata("design:paramtypes", [Repository,
        Repository])
], DriversService);
export { DriversService };
