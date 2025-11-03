import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { REDIS_CLIENT } from '../redis/redis.provider.js';
import { Redis } from 'ioredis';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    @Inject(REDIS_CLIENT) private redis: Redis
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      async () => {
        try {
          // Check if Redis is available and connected
          if (this.redis.status === 'ready' || this.redis.status === 'connecting') {
            await this.redis.ping();
            return { redis: { status: 'up' } };
          } else {
            // Redis is not connected but that's okay - it's optional
            return { redis: { status: 'down', message: 'Redis not connected (optional)' } };
          }
        } catch (error) {
          // Redis is unavailable but that's okay - it's optional for the app
          return { redis: { status: 'down', message: 'Redis unavailable (optional)' } };
        }
      }
    ]);
  }
}

