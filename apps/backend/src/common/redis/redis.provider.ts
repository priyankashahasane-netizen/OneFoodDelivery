import { Inject, Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export const REDIS_SUB_CLIENT = Symbol('REDIS_SUB_CLIENT');

// Helper to configure Redis with proper error handling
function configureRedisClient(redis: Redis, logger: Logger, clientName: string): Redis {
  let connectionAttempts = 0;
  let lastErrorLogged = 0;
  const ERROR_LOG_INTERVAL = 30000; // Log errors at most once every 30 seconds

  // Handle connection errors gracefully
  redis.on('error', (error: Error & { code?: string }) => {
    const now = Date.now();
    connectionAttempts++;
    
    // Only log errors if enough time has passed since last log to avoid spam
    if (now - lastErrorLogged > ERROR_LOG_INTERVAL || connectionAttempts === 1) {
      logger.warn(
        `Redis ${clientName} connection error (attempt ${connectionAttempts}). ` +
        `The application will continue without Redis caching. Error: ${error.message}`
      );
      lastErrorLogged = now;
    }
    
    // Suppress unhandled error warnings - we're handling them here
    if (error.code === 'ECONNREFUSED') {
      // Expected when Redis is not available - don't spam logs
      return;
    }
  });

  // Log successful connections
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

  redis.on('reconnecting', (delay: number) => {
    if (connectionAttempts <= 3) {
      logger.log(`Redis ${clientName} reconnecting in ${delay}ms`);
    }
  });

  return redis;
}

@Injectable()
export class RedisProvider implements OnModuleDestroy {
  private readonly logger = new Logger(RedisProvider.name);
  
  constructor(private readonly client: Redis) {}

  onModuleDestroy() {
    try {
      this.client.disconnect();
      this.logger.log('Redis client disconnected');
    } catch (error) {
      this.logger.warn('Error disconnecting Redis:', error);
    }
  }
}

export const RedisClientProvider = {
  provide: REDIS_CLIENT,
  useFactory: async (configService: ConfigService) => {
    const logger = new Logger('RedisClient');
    const url = configService.get<string>('redis.url', { infer: true })!;
    
    const redis = new Redis(url, { 
      lazyConnect: true,
      retryStrategy: (times) => {
        // Exponential backoff with max delay of 5 seconds
        const delay = Math.min(times * 100, 5000);
        
        // Stop retrying after 10 attempts to avoid infinite retries
        if (times > 10) {
          logger.warn('Redis connection retry limit reached. Continuing without Redis.');
          return null; // Stop retrying
        }
        
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false, // Don't queue commands when disconnected
      enableReadyCheck: true,
      connectTimeout: 5000, // 5 second timeout
    });

    // Configure error handling
    configureRedisClient(redis, logger, 'Client');

    // Try to connect, but don't fail the application if Redis is unavailable
    try {
      await redis.connect().catch((err) => {
        // Connection failed, but that's okay - we'll retry on demand
        logger.debug(`Redis initial connection failed (will retry on demand): ${err.message}`);
      });
    } catch (err) {
      logger.debug(`Redis initial connection attempt failed: ${err.message}`);
    }

    return redis;
  },
  inject: [ConfigService]
};

export const InjectRedis = () => Inject(REDIS_CLIENT);

export const RedisSubscriberProvider = {
  provide: REDIS_SUB_CLIENT,
  useFactory: (configService: ConfigService) => {
    const logger = new Logger('RedisSubscriber');
    const url = configService.get<string>('redis.url', { infer: true })!;
    
    // Separate connection for pub/sub with similar configuration
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

    // Configure error handling
    configureRedisClient(redis, logger, 'Subscriber');

    // Don't connect immediately - let it connect on demand
    redis.connect().catch((err) => {
      logger.debug(`Redis subscriber initial connection failed (will retry on demand): ${err.message}`);
    });

    return redis;
  },
  inject: [ConfigService]
};

export const InjectRedisSub = () => Inject(REDIS_SUB_CLIENT);

