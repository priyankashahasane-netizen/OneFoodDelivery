var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
let CustomJwtService = class CustomJwtService {
    jwtService;
    configService;
    jwtSecret;
    tokenExpiration;
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.jwtSecret = this.configService.get('JWT_SECRET') ?? 'dev-secret';
        this.tokenExpiration = this.configService.get('JWT_EXPIRATION') ?? '30d';
    }
    async generateToken(payload) {
        const { iat, exp, ...cleanPayload } = payload;
        const token = await this.jwtService.signAsync(cleanPayload, {
            secret: this.jwtSecret,
            expiresIn: this.tokenExpiration,
        });
        const expiresInSeconds = this.parseExpiration(this.tokenExpiration);
        const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
        return {
            access_token: token,
            token: token,
            expiresIn: expiresInSeconds,
            expiresAt,
        };
    }
    async generateAdminToken(username) {
        return this.generateToken({
            sub: 'admin',
            username,
            role: 'admin',
        });
    }
    async generateDriverToken(driverId, phone) {
        return this.generateToken({
            sub: driverId,
            phone,
            role: 'driver',
        });
    }
    async verifyToken(token) {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.jwtSecret,
            });
            return payload;
        }
        catch (error) {
            return null;
        }
    }
    parseExpiration(expiration) {
        const regex = /^(\d+)([smhd])$/;
        const match = expiration.match(regex);
        if (!match) {
            return 2592000;
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 3600;
            case 'd':
                return value * 86400;
            default:
                return 2592000;
        }
    }
    getSecret() {
        return this.jwtSecret;
    }
    isUsingDefaultSecret() {
        return this.jwtSecret === 'dev-secret';
    }
};
CustomJwtService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [JwtService,
        ConfigService])
], CustomJwtService);
export { CustomJwtService };
