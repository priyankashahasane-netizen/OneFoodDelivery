import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InjectRedis, REDIS_CLIENT } from '../../common/redis/redis.provider.js';
import type { RoutesService } from '../routes/routes.service.js';
import { TrackingPointEntity } from './entities/tracking-point.entity.js';

// Lazy class reference to avoid circular dependency
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const getRoutesService = () => {
  return require('../routes/routes.service.js').RoutesService;
};

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(TrackingPointEntity)
    private readonly trackingRepository: Repository<TrackingPointEntity>,
    @InjectRedis() private readonly redis,
    @Inject(forwardRef(() => getRoutesService()))
    private readonly routesService: RoutesService
  ) {}

  async listRecent(orderId: string, limit = 50) {
    return this.trackingRepository.find({
      where: { orderId },
      order: { recordedAt: 'DESC' },
      take: limit
    });
  }

  async record(orderId: string, payload: {
    driverId: string; lat: number; lng: number; speed?: number; heading?: number; ts?: string;
  }, idempotencyKey?: string) {
    // Handle idempotency check with Redis (optional)
    if (idempotencyKey && this.isRedisAvailable()) {
      try {
        const key = `idem:track:${orderId}:${idempotencyKey}`;
        const set = await this.redis.set(key, '1', 'NX', 'EX', 60);
        if (!set) {
          // duplicate, return last record shortcut (no DB write)
          return {
            id: key,
            orderId,
            driverId: payload.driverId,
            latitude: payload.lat,
            longitude: payload.lng,
            recordedAt: new Date()
          } as any;
        }
      } catch (redisError) {
        // Redis unavailable, continue without idempotency check
        // In production, you might want to handle this differently
      }
    }
    
    const entity = this.trackingRepository.create({
      orderId,
      driverId: payload.driverId,
      latitude: payload.lat,
      longitude: payload.lng,
      speed: payload.speed ?? null,
      heading: payload.heading ?? null,
      recordedAt: payload.ts ? new Date(payload.ts) : new Date(),
      metadata: null
    });
    const saved = await this.trackingRepository.save(entity);
    
    // Publish to channel for SSE listeners (optional - fail gracefully if Redis unavailable)
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
      } catch (redisError) {
        // Redis publish failed, but tracking is already saved - continue
        // SSE subscribers won't get real-time updates, but data is persisted
      }
    }

    // Deviation check: if far from next planned stop, trigger re-optimization
    try {
      const plan = await this.routesService.getLatestPlanForDriver(payload.driverId);
      const next = plan?.stops?.[0];
      if (next) {
        const dist = haversine(payload.lat, payload.lng, next.lat, next.lng);
        if (dist > 0.5) {
          // >500m
          await this.routesService.enqueueOptimizationForDriver(payload.driverId);
        }
      }
    } catch {}
    return saved;
  }

  private isRedisAvailable(): boolean {
    return this.redis && (this.redis.status === 'ready' || this.redis.status === 'connecting');
  }
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // km
  return d;
}

function toRad(deg: number) {
  return deg * Math.PI / 180;
}

