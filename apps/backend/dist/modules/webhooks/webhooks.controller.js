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
var WebhooksController_1;
import { Controller, Post, Body, Headers, Logger, BadRequestException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service.js';
import { CreateOrderFromWebhookDto } from './dto/create-order-webhook.dto.js';
let WebhooksController = WebhooksController_1 = class WebhooksController {
    webhooksService;
    logger = new Logger(WebhooksController_1.name);
    constructor(webhooksService) {
        this.webhooksService = webhooksService;
    }
    async handleOrderWebhook(dto, signature, platformKey) {
        this.logger.log(`Received webhook from ${dto.platform}: ${dto.externalRef}`);
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
        }
        catch (error) {
            this.logger.error(`Failed to process webhook: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to process order: ${error.message}`);
        }
    }
    async testWebhook() {
        const testPayload = {
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
};
__decorate([
    Post('orders'),
    __param(0, Body()),
    __param(1, Headers('x-webhook-signature')),
    __param(2, Headers('x-platform-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateOrderFromWebhookDto, String, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleOrderWebhook", null);
__decorate([
    Post('test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "testWebhook", null);
WebhooksController = WebhooksController_1 = __decorate([
    Controller('webhooks'),
    __metadata("design:paramtypes", [WebhooksService])
], WebhooksController);
export { WebhooksController };
