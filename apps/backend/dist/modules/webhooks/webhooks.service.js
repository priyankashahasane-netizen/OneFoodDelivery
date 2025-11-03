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
var WebhooksService_1;
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../orders/entities/order.entity.js';
let WebhooksService = WebhooksService_1 = class WebhooksService {
    orderRepository;
    logger = new Logger(WebhooksService_1.name);
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }
    async processOrderWebhook(dto) {
        this.logger.log(`Processing order from ${dto.platform}: ${dto.externalRef}`);
        const existingOrder = await this.orderRepository.findOne({
            where: { externalRef: dto.externalRef },
        });
        if (existingOrder) {
            this.logger.warn(`Duplicate order detected: ${dto.externalRef}`);
            return existingOrder;
        }
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
        });
        const savedOrder = await this.orderRepository.save(order);
        this.logger.log(`Order saved with ID: ${savedOrder.id} from ${dto.platform} (Customer: ${dto.customerName || dto.customerPhone})`);
        return savedOrder;
    }
    verifySignature(platform, signature, payload) {
        this.logger.debug(`Verifying signature for ${platform}`);
        return true;
    }
};
WebhooksService = WebhooksService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(OrderEntity)),
    __metadata("design:paramtypes", [Repository])
], WebhooksService);
export { WebhooksService };
