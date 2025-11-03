import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
export declare const REDIS_CLIENT: unique symbol;
export declare const REDIS_SUB_CLIENT: unique symbol;
export declare class RedisProvider implements OnModuleDestroy {
    private readonly client;
    private readonly logger;
    constructor(client: Redis);
    onModuleDestroy(): void;
}
export declare const RedisClientProvider: {
    provide: symbol;
    useFactory: (configService: ConfigService) => Promise<Redis>;
    inject: (typeof ConfigService)[];
};
export declare const InjectRedis: () => PropertyDecorator & ParameterDecorator;
export declare const RedisSubscriberProvider: {
    provide: symbol;
    useFactory: (configService: ConfigService) => Redis;
    inject: (typeof ConfigService)[];
};
export declare const InjectRedisSub: () => PropertyDecorator & ParameterDecorator;
