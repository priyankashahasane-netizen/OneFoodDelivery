import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRedis } from '../../common/redis/redis.provider.js';
import { FcmService } from './fcm.service.js';
import type { DriversService } from '../drivers/drivers.service.js';
import type { OrdersService } from '../orders/orders.service.js';

// Lazy class references to avoid circular dependency
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const getDriversService = () => {
  return require('../drivers/drivers.service.js').DriversService;
};
const getOrdersService = () => {
  return require('../orders/orders.service.js').OrdersService;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(
    @InjectRedis() private readonly redis,
    private readonly fcmService: FcmService,
    @Inject(forwardRef(() => getDriversService()))
    private readonly driversService: DriversService,
    @Inject(forwardRef(() => getOrdersService()))
    private readonly ordersService: OrdersService
  ) {}

  async broadcastAssignment(orderId: string, driverId: string) {
    const msg = await this.renderTemplate('assignment', { orderId, driverId });
    this.logger.log(`[NOTIFICATION] ${msg}`);

    // Send FCM notification to the driver
    try {
      this.logger.log(`[NOTIFICATION] Attempting to send assignment notification for order ${orderId} to driver ${driverId}`);
      
      const driver = await this.driversService.findById(driverId);
      this.logger.debug(`[NOTIFICATION] Driver found: ${driver.name} (${driver.phone})`);
      
      const fcmToken = (driver.metadata as any)?.fcmToken;
      this.logger.debug(`[NOTIFICATION] FCM token from metadata: ${fcmToken ? 'Present' : 'Missing'}`);

      if (fcmToken && typeof fcmToken === 'string' && fcmToken.trim() !== '') {
        // Get all currently assigned orders for this driver (status = 'assigned')
        const assignedOrders = await this.ordersService.getActiveOrdersByDriverRaw(driverId);
        
        // Filter to only 'assigned' status orders (not picked_up, in_transit, etc.)
        const newlyAssignedOrders = assignedOrders.filter(o => o.status === 'assigned');
        
        this.logger.debug(`[NOTIFICATION] Found ${newlyAssignedOrders.length} assigned order(s) for driver ${driverId}`);

        if (newlyAssignedOrders.length === 0) {
          this.logger.warn(`[NOTIFICATION] No assigned orders found for driver ${driverId}, skipping notification`);
          return;
        }

        // Get order numbers for all assigned orders
        const orderNumbers: string[] = [];
        const orderIds: string[] = [];

        for (const order of newlyAssignedOrders) {
          // Get order number - prefer externalRef, fallback to numeric ID
          let orderNumber: string;
          if (order.externalRef && order.externalRef.trim() !== '') {
            orderNumber = order.externalRef;
          } else {
            // Convert orderId to numeric ID for Flutter app compatibility
            const orderIdNumeric = this.uuidToNumericId(order.id);
            orderNumber = `#${orderIdNumeric}`;
          }
          orderNumbers.push(orderNumber);
          orderIds.push(order.id);
        }

        // Format message with list of order numbers
        let body: string;
        if (orderNumbers.length === 1) {
          body = `${orderNumbers[0]} is assigned to you.... want to accept it?`;
        } else {
          // Multiple orders: "#123, #456, #789 are assigned to you.... want to accept them?"
          const orderList = orderNumbers.join(', ');
          body = `${orderList} are assigned to you.... want to accept them?`;
        }

        // Use the first order ID for the notification data (Flutter app expects single order_id)
        // The app can fetch all assigned orders when it opens
        const firstOrderIdNumeric = this.uuidToNumericId(orderIds[0]);

        // Flutter app expects 'type' field to be 'assign' for assignment notifications
        // and 'order_id' as a numeric string
        const notificationData: Record<string, string> = {
          type: 'assign',
          order_id: firstOrderIdNumeric.toString()
        };

        const title = 'New Order Assigned';
        
        this.logger.log(`[NOTIFICATION] Sending FCM notification with title: "${title}", body: "${body}", data: ${JSON.stringify(notificationData)}`);
        this.logger.log(`[NOTIFICATION] Order numbers: ${orderNumbers.join(', ')}`);

        const sent = await this.fcmService.sendNotification(
          fcmToken,
          title,
          body,
          notificationData
        );

        if (sent) {
          this.logger.log(`[NOTIFICATION] ✅ Successfully sent assignment notification to driver ${driverId} (${driver.phone}) for ${orderNumbers.length} order(s): ${orderNumbers.join(', ')}`);
        } else {
          this.logger.warn(`[NOTIFICATION] ❌ Failed to send assignment notification to driver ${driverId} (${driver.phone}) for ${orderNumbers.length} order(s): ${orderNumbers.join(', ')}`);
        }
      } else {
        this.logger.warn(`[NOTIFICATION] ⚠️ Driver ${driverId} (${driver.phone}) does not have a valid FCM token. Token value: ${fcmToken ? 'empty string' : 'undefined/null'}`);
        this.logger.warn(`[NOTIFICATION] Driver metadata: ${JSON.stringify(driver.metadata)}`);
      }
    } catch (error: any) {
      this.logger.error(`[NOTIFICATION] ❌ Error sending assignment notification to driver ${driverId} for order ${orderId}:`, error.message || error);
      this.logger.error(`[NOTIFICATION] Error stack:`, error.stack);
      // Don't throw - notification failure shouldn't break the assignment
    }
  }

  /**
   * Convert UUID to numeric ID (for compatibility with Flutter app)
   * Uses a simple hash function to get consistent numeric value
   */
  private uuidToNumericId(uuid: string): number {
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
      const char = uuid.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Return positive number between 1 and max safe integer
    return Math.abs(hash % 2147483647) || 1;
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

