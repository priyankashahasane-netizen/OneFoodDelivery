import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '../../common/redis/redis.provider.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(@InjectRedis() private readonly redis) {}

  async broadcastAssignment(orderId: string, driverId: string) {
    const msg = await this.renderTemplate('assignment', { orderId, driverId });
    this.logger.log(msg);
  }

  async broadcastDeliveryCompleted(orderId: string) {
    const msg = await this.renderTemplate('delivered', { orderId });
    this.logger.log(msg);
  }

  async getTemplates() {
    const keys = ['assignment', 'delivered'];
    if (!this.isRedisAvailable()) {
      // Return default templates if Redis is unavailable
      return Object.fromEntries(keys.map(k => [k, this.defaultTemplate(k)]));
    }
    
    try {
      const entries = await Promise.all(
        keys.map(async (k) => {
          try {
            const cached = await this.redis.get(`tmpl:${k}`);
            return [k, cached ?? this.defaultTemplate(k)];
          } catch (error) {
            this.logger.debug(`Failed to get template ${k} from Redis, using default`);
            return [k, this.defaultTemplate(k)];
          }
        })
      );
      return Object.fromEntries(entries);
    } catch (error) {
      this.logger.warn('Failed to get templates from Redis, using defaults');
      return Object.fromEntries(keys.map(k => [k, this.defaultTemplate(k)]));
    }
  }

  async updateTemplates(payload: Record<string, string>) {
    if (!this.isRedisAvailable()) {
      this.logger.warn('Redis unavailable, templates will not be persisted');
      return this.getTemplates();
    }
    
    try {
      for (const [k, v] of Object.entries(payload)) {
        await this.redis.set(`tmpl:${k}`, v, 'EX', 60 * 60 * 24 * 30);
      }
    } catch (error) {
      this.logger.warn('Failed to update templates in Redis:', error);
    }
    return this.getTemplates();
  }

  private async renderTemplate(key: string, vars: Record<string, unknown>) {
    let raw = this.defaultTemplate(key);
    
    if (this.isRedisAvailable()) {
      try {
        const cached = await this.redis.get(`tmpl:${key}`);
        if (cached) {
          raw = cached;
        }
      } catch (error) {
        this.logger.debug(`Failed to get template ${key} from Redis, using default`);
      }
    }
    
    return raw.replace(/\{(\w+)\}/g, (_, g1) => String(vars[g1] ?? ''));
  }

  private isRedisAvailable(): boolean {
    return this.redis && (this.redis.status === 'ready' || this.redis.status === 'connecting');
  }

  private defaultTemplate(key: string) {
    switch (key) {
      case 'assignment':
        return 'Order {orderId} assigned to driver {driverId}.';
      case 'delivered':
        return 'Order {orderId} has been delivered.';
      default:
        return '';
    }
  }
}

