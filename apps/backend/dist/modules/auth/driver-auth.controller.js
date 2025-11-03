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
import { Body, Controller, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { InjectRedis } from '../../common/redis/redis.provider.js';
import { Public } from './public.decorator.js';
import { DriverEntity } from '../drivers/entities/driver.entity.js';
let DriverOtpController = class DriverOtpController {
    jwt;
    drivers;
    redis;
    constructor(jwt, drivers, redis) {
        this.jwt = jwt;
        this.drivers = drivers;
        this.redis = redis;
    }
    async request(body) {
        try {
            if (!body.phone) {
                return { ok: false, message: 'Phone number is required' };
            }
            const code = (randomInt(0, 999999) + '').padStart(6, '0');
            const key = `otp:driver:${body.phone}`;
            if (this.isRedisAvailable()) {
                try {
                    await this.redis.set(key, code, 'EX', 300);
                }
                catch (redisError) {
                    console.warn('Redis unavailable for OTP storage. OTP functionality may be limited.');
                }
            }
            else {
                console.warn('Redis not available for OTP storage. OTP functionality may be limited.');
            }
            console.log(`[DEV] OTP for ${body.phone}: ${code}`);
            return { ok: true };
        }
        catch (error) {
            console.error('OTP request error:', error);
            return { ok: false, message: 'Failed to send OTP', error: error.message };
        }
    }
    async verify(body) {
        try {
            if (!body.phone || !body.code) {
                return { ok: false, message: 'Phone number and code are required' };
            }
            if (this.isRedisAvailable()) {
                try {
                    const key = `otp:driver:${body.phone}`;
                    const stored = await this.redis.get(key);
                    if (!stored || stored !== body.code) {
                        return { ok: false, message: 'Invalid OTP code' };
                    }
                    await this.redis.del(key);
                }
                catch (redisError) {
                    console.warn('Redis unavailable for OTP verification. Skipping OTP check (development mode).');
                    return { ok: false, message: 'OTP verification unavailable. Redis is required for OTP verification.' };
                }
            }
            else {
                return { ok: false, message: 'OTP verification unavailable. Redis is required for OTP verification.' };
            }
            let driver = await this.drivers.findOne({ where: { phone: body.phone } });
            if (!driver) {
                driver = this.drivers.create({ phone: body.phone, name: body.phone, vehicleType: 'unknown', capacity: 1, online: false });
                driver = await this.drivers.save(driver);
            }
            const token = await this.jwt.signAsync({ sub: driver.id, phone: driver.phone, role: 'driver' }, {
                secret: process.env.JWT_SECRET ?? 'dev-secret',
                expiresIn: '30d'
            });
            return { ok: true, access_token: token, token: token, driverId: driver.id };
        }
        catch (error) {
            console.error('OTP verify error:', error);
            return { ok: false, message: 'Failed to verify OTP', error: error.message };
        }
    }
    isRedisAvailable() {
        return this.redis && (this.redis.status === 'ready' || this.redis.status === 'connecting');
    }
    async legacyLogin(body) {
        try {
            if (!body.phone || !body.password) {
                return { ok: false, message: 'Phone number and password are required' };
            }
            let driver = await this.drivers.findOne({ where: { phone: body.phone } });
            if (!driver) {
                const hashedPassword = await bcrypt.hash('123456', 10);
                driver = this.drivers.create({
                    phone: body.phone,
                    name: body.phone,
                    vehicleType: 'unknown',
                    capacity: 1,
                    online: false,
                    metadata: { password: hashedPassword }
                });
                driver = await this.drivers.save(driver);
            }
            const storedPassword = driver.metadata?.password;
            let isValidPassword = false;
            if (storedPassword) {
                isValidPassword = await bcrypt.compare(body.password, storedPassword);
            }
            else {
                isValidPassword = body.password === '123456';
                if (isValidPassword) {
                    const hashedPassword = await bcrypt.hash(body.password, 10);
                    driver.metadata = { ...driver.metadata, password: hashedPassword };
                    await this.drivers.save(driver);
                }
            }
            if (!isValidPassword) {
                return { ok: false, message: 'Invalid phone number or password' };
            }
            const token = await this.jwt.signAsync({ sub: driver.id, phone: driver.phone, role: 'driver' }, {
                secret: process.env.JWT_SECRET ?? 'dev-secret',
                expiresIn: '30d'
            });
            return {
                ok: true,
                token: token,
                access_token: token,
                delivery_man: {
                    id: driver.id,
                    phone: driver.phone,
                    name: driver.name
                }
            };
        }
        catch (error) {
            console.error('Legacy login error:', error);
            return { ok: false, message: 'Login failed', error: error.message };
        }
    }
};
__decorate([
    Public(),
    Post('auth/driver/otp/request'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverOtpController.prototype, "request", null);
__decorate([
    Public(),
    Post('auth/driver/otp/verify'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverOtpController.prototype, "verify", null);
__decorate([
    Public(),
    Post('v1/auth/delivery-man/login'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverOtpController.prototype, "legacyLogin", null);
DriverOtpController = __decorate([
    Controller(),
    __param(1, InjectRepository(DriverEntity)),
    __param(2, InjectRedis()),
    __metadata("design:paramtypes", [JwtService,
        Repository, Object])
], DriverOtpController);
export { DriverOtpController };
