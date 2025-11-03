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
var NotificationsService_1;
import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '../../common/redis/redis.provider.js';
let NotificationsService = NotificationsService_1 = class NotificationsService {
    redis;
    logger = new Logger(NotificationsService_1.name);
    constructor(redis) {
        this.redis = redis;
    }
    async broadcastAssignment(orderId, driverId) {
        const msg = await this.renderTemplate('assignment', { orderId, driverId });
        this.logger.log(msg);
    }
    async broadcastDeliveryCompleted(orderId) {
        const msg = await this.renderTemplate('delivered', { orderId });
        this.logger.log(msg);
    }
    async getTemplates() {
        const keys = ['assignment', 'delivered'];
        if (!this.isRedisAvailable()) {
            return Object.fromEntries(keys.map(k => [k, this.defaultTemplate(k)]));
        }
        try {
            const entries = await Promise.all(keys.map(async (k) => {
                try {
                    const cached = await this.redis.get(`tmpl:${k}`);
                    return [k, cached ?? this.defaultTemplate(k)];
                }
                catch (error) {
                    this.logger.debug(`Failed to get template ${k} from Redis, using default`);
                    return [k, this.defaultTemplate(k)];
                }
            }));
            return Object.fromEntries(entries);
        }
        catch (error) {
            this.logger.warn('Failed to get templates from Redis, using defaults');
            return Object.fromEntries(keys.map(k => [k, this.defaultTemplate(k)]));
        }
    }
    async updateTemplates(payload) {
        if (!this.isRedisAvailable()) {
            this.logger.warn('Redis unavailable, templates will not be persisted');
            return this.getTemplates();
        }
        try {
            for (const [k, v] of Object.entries(payload)) {
                await this.redis.set(`tmpl:${k}`, v, 'EX', 60 * 60 * 24 * 30);
            }
        }
        catch (error) {
            this.logger.warn('Failed to update templates in Redis:', error);
        }
        return this.getTemplates();
    }
    async renderTemplate(key, vars) {
        let raw = this.defaultTemplate(key);
        if (this.isRedisAvailable()) {
            try {
                const cached = await this.redis.get(`tmpl:${key}`);
                if (cached) {
                    raw = cached;
                }
            }
            catch (error) {
                this.logger.debug(`Failed to get template ${key} from Redis, using default`);
            }
        }
        return raw.replace(/\{(\w+)\}/g, (_, g1) => String(vars[g1] ?? ''));
    }
    isRedisAvailable() {
        return this.redis && (this.redis.status === 'ready' || this.redis.status === 'connecting');
    }
    defaultTemplate(key) {
        switch (key) {
            case 'assignment':
                return 'Order {orderId} assigned to driver {driverId}.';
            case 'delivered':
                return 'Order {orderId} has been delivered.';
            default:
                return '';
        }
    }
};
NotificationsService = NotificationsService_1 = __decorate([
    Injectable(),
    __param(0, InjectRedis()),
    __metadata("design:paramtypes", [Object])
], NotificationsService);
export { NotificationsService };
