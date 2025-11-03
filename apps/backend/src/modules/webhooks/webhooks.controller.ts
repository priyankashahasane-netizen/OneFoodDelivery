import { Controller, Post, Body, Headers, Logger, BadRequestException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service.js';
import { CreateOrderFromWebhookDto } from './dto/create-order-webhook.dto.js';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * Webhook endpoint for third-party platforms (Zomato, Swiggy, UberEats, etc.)
   * POST /api/webhooks/orders
   *
   * Expected payload format:
   * {
   *   "platform": "zomato|swiggy|ubereats|dunzo",
   *   "externalRef": "ZOMATO-12345",
   *   "pickup": {
   *     "lat": 12.9716,
   *     "lng": 77.5946,
   *     "address": "Pizza Hut, MG Road, Bengaluru"
   *   },
   *   "dropoff": {
   *     "lat": 12.9558,
   *     "lng": 77.6077,
   *     "address": "Prestige Tech Park, Bengaluru"
   *   },
   *   "items": [
   *     { "name": "Margherita Pizza", "quantity": 1, "price": 299 }
   *   ],
   *   "paymentType": "cash|online",
   *   "customerPhone": "+919999999999",
   *   "customerName": "John Doe",
   *   "slaMinutes": 45
   * }
   */
  @Post('orders')
  async handleOrderWebhook(
    @Body() dto: CreateOrderFromWebhookDto,
    @Headers('x-webhook-signature') signature?: string,
    @Headers('x-platform-key') platformKey?: string,
  ) {
    this.logger.log(`Received webhook from ${dto.platform}: ${dto.externalRef}`);

    // Optional: Verify webhook signature (implement signature verification)
    // if (!this.webhooksService.verifySignature(dto.platform, signature, dto)) {
    //   throw new BadRequestException('Invalid webhook signature');
    // }

    try {
      const order = await this.webhooksService.processOrderWebhook(dto);

      this.logger.log(`Order created successfully: ${order.id}`);

      return {
        success: true,
        orderId: order.id,
        trackingUrl: order.trackingUrl,
        status: order.status,
        message: 'Order received and queued for assignment',
      };
    } catch (error) {
      this.logger.error(`Failed to process webhook: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to process order: ${error.message}`);
    }
  }

  /**
   * Test endpoint to simulate webhook
   * POST /api/webhooks/test
   */
  @Post('test')
  async testWebhook() {
    const testPayload: CreateOrderFromWebhookDto = {
      platform: 'test',
      externalRef: `TEST-${Date.now()}`,
      pickup: {
        lat: 12.9716,
        lng: 77.5946,
        address: 'Test Restaurant, MG Road, Bengaluru',
      },
      dropoff: {
        lat: 12.9558,
        lng: 77.6077,
        address: 'Test Customer Location, Bengaluru',
      },
      items: [
        { name: 'Test Item', quantity: 1, price: 199 },
      ],
      paymentType: 'online',
      customerPhone: '+919999999999',
      customerName: 'Test Customer',
      slaMinutes: 30,
    };

    return this.handleOrderWebhook(testPayload);
  }
}
