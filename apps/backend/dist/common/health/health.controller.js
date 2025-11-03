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
import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { REDIS_CLIENT } from '../redis/redis.provider.js';
import { Redis } from 'ioredis';
let HealthController = class HealthController {
    health;
    db;
    redis;
    constructor(health, db, redis) {
        this.health = health;
        this.db = db;
        this.redis = redis;
    }
    async check() {
        return this.health.check([
            () => this.db.pingCheck('database'),
            async () => {
                try {
                    if (this.redis.status === 'ready' || this.redis.status === 'connecting') {
                        await this.redis.ping();
                        return { redis: { status: 'up' } };
                    }
                    else {
                        return { redis: { status: 'down', message: 'Redis not connected (optional)' } };
                    }
                }
                catch (error) {
                    return { redis: { status: 'down', message: 'Redis unavailable (optional)' } };
                }
            }
        ]);
    }
};
__decorate([
    Get(),
    HealthCheck(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
HealthController = __decorate([
    Controller('health'),
    __param(2, Inject(REDIS_CLIENT)),
    __metadata("design:paramtypes", [HealthCheckService,
        TypeOrmHealthIndicator,
        Redis])
], HealthController);
export { HealthController };
