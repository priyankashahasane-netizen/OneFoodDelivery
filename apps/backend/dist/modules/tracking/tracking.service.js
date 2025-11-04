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
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '../../common/redis/redis.provider.js';
import { TrackingPointEntity } from './entities/tracking-point.entity.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const getRoutesService = () => {
    return require('../routes/routes.service.js').RoutesService;
};
let TrackingService = class TrackingService {
    trackingRepository;
    redis;
    routesService;
    constructor(trackingRepository, redis, routesService) {
        this.trackingRepository = trackingRepository;
        this.redis = redis;
        this.routesService = routesService;
    }
    async listRecent(orderId, limit = 50) {
        return this.trackingRepository.find({
            where: { orderId },
            order: { recordedAt: 'DESC' },
            take: limit
        });
    }
    async record(orderId, payload, idempotencyKey) {
        const isValidUUID = (str) => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(str);
        };
        if (!isValidUUID(orderId) || !isValidUUID(payload.driverId)) {
            const mockSaved = {
                id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                orderId,
                driverId: payload.driverId,
                latitude: payload.lat,
                longitude: payload.lng,
                speed: payload.speed ?? null,
                heading: payload.heading ?? null,
                recordedAt: payload.ts ? new Date(payload.ts) : new Date(),
            };
            if (this.isRedisAvailable()) {
                try {
                    await this.redis.publish(`track:${orderId}`, JSON.stringify({
                        type: 'position',
                        data: {
                            orderId,
                            driverId: payload.driverId,
                            lat: payload.lat,
                            lng: payload.lng,
                            speed: payload.speed ?? null,
                            heading: payload.heading ?? null,
                            ts: mockSaved.recordedAt
                        }
                    }));
                }
                catch (redisError) {
                }
            }
            return mockSaved;
        }
        if (idempotencyKey && this.isRedisAvailable()) {
            try {
                const key = `idem:track:${orderId}:${idempotencyKey}`;
                const set = await this.redis.set(key, '1', 'NX', 'EX', 60);
                if (!set) {
                    return {
                        id: key,
                        orderId,
                        driverId: payload.driverId,
                        latitude: payload.lat,
                        longitude: payload.lng,
                        recordedAt: new Date()
                    };
                }
            }
            catch (redisError) {
            }
        }
        try {
            const recordedAt = payload.ts ? new Date(payload.ts) : new Date();
            const result = await this.trackingRepository.manager.query(`INSERT INTO tracking_points (order_id, driver_id, latitude, longitude, speed, heading, recorded_at, metadata, created_at, ingest_sequence)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), DEFAULT)
         RETURNING id`, [
                orderId,
                payload.driverId,
                payload.lat,
                payload.lng,
                payload.speed ?? null,
                payload.heading ?? null,
                recordedAt,
                null
            ]);
            const saved = {
                id: result[0].id,
                orderId,
                driverId: payload.driverId,
                latitude: payload.lat,
                longitude: payload.lng,
                speed: payload.speed ?? null,
                heading: payload.heading ?? null,
                recordedAt
            };
            if (this.isRedisAvailable()) {
                try {
                    await this.redis.publish(`track:${orderId}`, JSON.stringify({
                        type: 'position',
                        data: {
                            orderId,
                            driverId: payload.driverId,
                            lat: payload.lat,
                            lng: payload.lng,
                            speed: payload.speed ?? null,
                            heading: payload.heading ?? null,
                            ts: saved.recordedAt
                        }
                    }));
                }
                catch (redisError) {
                }
            }
            try {
                const plan = await this.routesService.getLatestPlanForDriver(payload.driverId);
                const next = plan?.stops?.[0];
                if (next) {
                    const dist = haversine(payload.lat, payload.lng, next.lat, next.lng);
                    if (dist > 0.5) {
                        await this.routesService.enqueueOptimizationForDriver(payload.driverId);
                    }
                }
            }
            catch (error) {
            }
            return saved;
        }
        catch (error) {
            console.error('Tracking save error:', error?.code, error?.message || error);
            const recordedAt = payload.ts ? new Date(payload.ts) : new Date();
            const mockSaved = {
                id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                orderId,
                driverId: payload.driverId,
                latitude: payload.lat,
                longitude: payload.lng,
                speed: payload.speed ?? null,
                heading: payload.heading ?? null,
                recordedAt,
            };
            if (this.isRedisAvailable()) {
                try {
                    await this.redis.publish(`track:${orderId}`, JSON.stringify({
                        type: 'position',
                        data: {
                            orderId,
                            driverId: payload.driverId,
                            lat: payload.lat,
                            lng: payload.lng,
                            speed: payload.speed ?? null,
                            heading: payload.heading ?? null,
                            ts: mockSaved.recordedAt
                        }
                    }));
                }
                catch (redisError) {
                }
            }
            return mockSaved;
        }
    }
    isRedisAvailable() {
        return this.redis && (this.redis.status === 'ready' || this.redis.status === 'connecting');
    }
};
TrackingService = __decorate([
    Injectable(),
    __param(0, InjectRepository(TrackingPointEntity)),
    __param(1, InjectRedis()),
    __param(2, Inject(forwardRef(() => getRoutesService()))),
    __metadata("design:paramtypes", [Repository, Object, Function])
], TrackingService);
export { TrackingService };
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
}
function toRad(deg) {
    return deg * Math.PI / 180;
}
