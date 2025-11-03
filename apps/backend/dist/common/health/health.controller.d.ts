import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Redis } from 'ioredis';
export declare class HealthController {
    private health;
    private db;
    private redis;
    constructor(health: HealthCheckService, db: TypeOrmHealthIndicator, redis: Redis);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
}
