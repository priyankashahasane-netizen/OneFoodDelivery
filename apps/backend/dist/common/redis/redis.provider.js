var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RedisProvider_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export const REDIS_SUB_CLIENT = Symbol('REDIS_SUB_CLIENT');
function configureRedisClient(redis, logger, clientName) {
    let connectionAttempts = 0;
    let lastErrorLogged = 0;
    const ERROR_LOG_INTERVAL = 30000;
    redis.on('error', (error) => {
        const now = Date.now();
        connectionAttempts++;
        if (now - lastErrorLogged > ERROR_LOG_INTERVAL || connectionAttempts === 1) {
            logger.warn(`Redis ${clientName} connection error (attempt ${connectionAttempts}). ` +
                `The application will continue without Redis caching. Error: ${error.message}`);
            lastErrorLogged = now;
        }
        if (error.code === 'ECONNREFUSED') {
            return;
        }
    });
    redis.on('connect', () => {
        logger.log(`Redis ${clientName} connected successfully`);
        connectionAttempts = 0;
    });
    redis.on('ready', () => {
        logger.log(`Redis ${clientName} is ready`);
    });
    redis.on('close', () => {
        logger.warn(`Redis ${clientName} connection closed`);
    });
    redis.on('reconnecting', (delay) => {
        if (connectionAttempts <= 3) {
            logger.log(`Redis ${clientName} reconnecting in ${delay}ms`);
        }
    });
    return redis;
}
let RedisProvider = RedisProvider_1 = class RedisProvider {
    client;
    logger = new Logger(RedisProvider_1.name);
    constructor(client) {
        this.client = client;
    }
    onModuleDestroy() {
        try {
            this.client.disconnect();
            this.logger.log('Redis client disconnected');
        }
        catch (error) {
            this.logger.warn('Error disconnecting Redis:', error);
        }
    }
};
RedisProvider = RedisProvider_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Redis])
], RedisProvider);
export { RedisProvider };
export const RedisClientProvider = {
    provide: REDIS_CLIENT,
    useFactory: async (configService) => {
        const logger = new Logger('RedisClient');
        const url = configService.get('redis.url', { infer: true });
        const redis = new Redis(url, {
            lazyConnect: true,
            retryStrategy: (times) => {
                const delay = Math.min(times * 100, 5000);
                if (times > 10) {
                    logger.warn('Redis connection retry limit reached. Continuing without Redis.');
                    return null;
                }
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableOfflineQueue: false,
            enableReadyCheck: true,
            connectTimeout: 5000,
        });
        configureRedisClient(redis, logger, 'Client');
        try {
            await redis.connect().catch((err) => {
                logger.debug(`Redis initial connection failed (will retry on demand): ${err.message}`);
            });
        }
        catch (err) {
            logger.debug(`Redis initial connection attempt failed: ${err.message}`);
        }
        return redis;
    },
    inject: [ConfigService]
};
export const InjectRedis = () => Inject(REDIS_CLIENT);
export const RedisSubscriberProvider = {
    provide: REDIS_SUB_CLIENT,
    useFactory: (configService) => {
        const logger = new Logger('RedisSubscriber');
        const url = configService.get('redis.url', { infer: true });
        const redis = new Redis(url, {
            lazyConnect: true,
            retryStrategy: (times) => {
                const delay = Math.min(times * 100, 5000);
                if (times > 10) {
                    logger.warn('Redis subscriber connection retry limit reached. Continuing without Redis pub/sub.');
                    return null;
                }
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableOfflineQueue: false,
            enableReadyCheck: true,
            connectTimeout: 5000,
        });
        configureRedisClient(redis, logger, 'Subscriber');
        redis.connect().catch((err) => {
            logger.debug(`Redis subscriber initial connection failed (will retry on demand): ${err.message}`);
        });
        return redis;
    },
    inject: [ConfigService]
};
export const InjectRedisSub = () => Inject(REDIS_SUB_CLIENT);
