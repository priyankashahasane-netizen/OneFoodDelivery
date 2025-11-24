import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../orders/entities/order.entity.js';
import { CreateOrderFromWebhookDto } from './dto/create-order-webhook.dto.js';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  /**
   * Process incoming order from third-party platform webhook
   */
  async processOrderWebhook(dto: CreateOrderFromWebhookDto): Promise<OrderEntity> {
    this.logger.log(`Processing order from ${dto.platform}: ${dto.externalRef}`);

    // Check for duplicate order
    const existingOrder = await this.orderRepository.findOne({
      where: { externalRef: dto.externalRef },
    });

    if (existingOrder) {
      this.logger.warn(`Duplicate order detected: ${dto.externalRef}`);
      return existingOrder;
    }

    // Create new order
    const order = this.orderRepository.create({
      externalRef: dto.externalRef,
      pickup: {
        lat: dto.pickup.lat,
        lng: dto.pickup.lng,
        address: dto.pickup.address,
      },
      dropoff: {
        lat: dto.dropoff.lat,
        lng: dto.dropoff.lng,
        address: dto.dropoff.address,
      },
      items: dto.items,
      paymentType: dto.paymentType,
      status: 'pending',
      slaSeconds: dto.slaMinutes * 60,
      customerName: dto.customerName || null,
      customerPhone: dto.customerPhone || null,
      customerEmail: dto.customerEmail || null,
    });

    const savedOrder = await this.orderRepository.save(order);

    this.logger.log(`Order saved with ID: ${savedOrder.id} from ${dto.platform} (Customer: ${dto.customerName || dto.customerPhone})`);

    // TODO: Emit event for auto-assignment logic
    // this.eventEmitter.emit('order.created', savedOrder);

    return savedOrder;
  }

  /**
   * Verify webhook signature (platform-specific)
   */
  verifySignature(platform: string, signature: string, payload: any): boolean {
    // Implement signature verification based on platform
    // For now, return true (skip verification in development)
    this.logger.debug(`Verifying signature for ${platform}`);
    return true;
  }
}
