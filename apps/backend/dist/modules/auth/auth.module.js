var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisClientProvider } from '../../common/redis/redis.provider.js';
import { AuthController } from './auth.controller.js';
import { JwtAuthGuard } from './jwt.guard.js';
import { JwtStrategy } from './jwt.strategy.js';
import { RolesGuard } from './roles.guard.js';
import { DriverOtpController } from './driver-auth.controller.js';
import { DriverEntity } from '../drivers/entities/driver.entity.js';
import { CustomJwtService } from './jwt.service.js';
let AuthModule = class AuthModule {
};
AuthModule = __decorate([
    Module({
        imports: [
            JwtModule.register({
                secret: process.env.JWT_SECRET ?? 'dev-secret',
                signOptions: {
                    expiresIn: '30d',
                },
            }),
            TypeOrmModule.forFeature([DriverEntity])
        ],
        controllers: [AuthController, DriverOtpController],
        providers: [
            JwtStrategy,
            CustomJwtService,
            { provide: APP_GUARD, useClass: JwtAuthGuard },
            { provide: APP_GUARD, useClass: RolesGuard },
            RedisClientProvider
        ],
        exports: [CustomJwtService]
    })
], AuthModule);
export { AuthModule };
