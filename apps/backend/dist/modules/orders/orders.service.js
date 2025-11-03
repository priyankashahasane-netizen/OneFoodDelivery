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
import { Injectable, Inject, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriversService } from '../drivers/drivers.service.js';
import { OrderEntity } from './entities/order.entity.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const getRoutesService = () => {
    return require('../routes/routes.service.js').RoutesService;
};
let OrdersService = class OrdersService {
    ordersRepository;
    driversService;
    routesService;
    constructor(ordersRepository, driversService, routesService) {
        this.ordersRepository = ordersRepository;
        this.driversService = driversService;
        this.routesService = routesService;
    }
    async listOrders(pagination) {
        const { page = 1, pageSize = 25 } = pagination;
        const [items, total] = await this.ordersRepository.findAndCount({
            take: pageSize,
            skip: (page - 1) * pageSize,
            order: { createdAt: 'DESC' }
        });
        return { items, total, page, pageSize };
    }
    async findById(orderId) {
        const order = await this.ordersRepository.findOne({ where: { id: orderId }, relations: ['driver'] });
        if (!order) {
            throw new NotFoundException(`Order ${orderId} not found`);
        }
        return order;
    }
    async upsert(orderId, payload) {
        const existing = await this.ordersRepository.findOne({ where: { id: orderId } });
        const partial = { id: orderId, ...payload };
        const entity = this.ordersRepository.merge(existing ?? this.ordersRepository.create(), partial);
        return this.ordersRepository.save(entity);
    }
    async assignDriver(orderId, driverId) {
        const order = await this.findById(orderId);
        const driver = await this.driversService.findById(driverId);
        order.driver = driver;
        order.driverId = driver.id;
        order.status = 'assigned';
        order.assignedAt = new Date();
        if (!order.trackingUrl) {
            const base = process.env.TRACKING_BASE_URL ?? 'http://localhost:3001/track';
            order.trackingUrl = `${base}/${order.id}`;
        }
        await this.ordersRepository.save(order);
        await this.routesService.enqueueOptimizationForDriver(driver.id);
        return order;
    }
    async updateStatus(orderId, status, payload) {
        const order = await this.findById(orderId);
        order.status = status;
        if (payload?.trackingUrl) {
            order.trackingUrl = payload.trackingUrl;
        }
        return this.ordersRepository.save(order);
    }
    async getActiveOrdersByDriver(driverId) {
        return this.ordersRepository
            .createQueryBuilder('order')
            .where('order.driverId = :driverId', { driverId })
            .andWhere('order.status NOT IN (:...statuses)', { statuses: ['delivered', 'canceled', 'failed', 'refunded', 'refund_requested', 'refund_request_canceled'] })
            .orderBy('order.assignedAt', 'DESC')
            .getMany();
    }
    async getAvailableOrders(driverId) {
        const qb = this.ordersRepository.createQueryBuilder('order')
            .where('order.status IN (:...statuses)', { statuses: ['pending', 'assigned'] })
            .orderBy('order.createdAt', 'DESC');
        if (driverId) {
            qb.andWhere('(order.driverId IS NULL OR order.driverId = :driverId)', { driverId });
        }
        else {
            qb.andWhere('order.driverId IS NULL');
        }
        return qb.getMany();
    }
    async getCompletedOrdersByDriver(driverId, options) {
        const offset = options.offset || 1;
        const limit = options.limit || 10;
        const status = options.status || 'all';
        const completedStatuses = ['delivered', 'canceled', 'refund_requested', 'refunded', 'refund_request_canceled'];
        const qb = this.ordersRepository
            .createQueryBuilder('order')
            .where('order.driverId = :driverId', { driverId })
            .orderBy('order.createdAt', 'DESC');
        if (status !== 'all') {
            qb.andWhere('order.status = :status', { status });
        }
        else {
            qb.andWhere('order.status IN (:...statuses)', { statuses: completedStatuses });
        }
        const total = await qb.getCount();
        const skip = (offset - 1) * limit;
        qb.skip(skip).take(limit);
        const orders = await qb.getMany();
        const countPromises = completedStatuses.map(async (s) => {
            const count = await this.ordersRepository.count({
                where: { driverId, status: s }
            });
            return { status: s, count };
        });
        const allCount = await this.ordersRepository
            .createQueryBuilder('order')
            .where('order.driverId = :driverId', { driverId })
            .andWhere('order.status IN (:...statuses)', { statuses: completedStatuses })
            .getCount();
        const statusCounts = await Promise.all(countPromises);
        const transformedOrders = orders.map((o, index) => {
            const restaurantAddress = typeof o.pickup === 'object' && o.pickup !== null ? o.pickup.address || '' : '';
            const deliveryAddressText = typeof o.dropoff === 'object' && o.dropoff !== null ? o.dropoff.address || '' : '';
            const items = o.items || [];
            const orderAmount = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
            const numericId = Math.abs(o.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000000;
            return {
                id: numericId,
                user_id: null,
                order_amount: orderAmount,
                coupon_discount_amount: 0,
                payment_status: 'unpaid',
                order_status: o.status,
                total_tax_amount: 0,
                payment_method: o.paymentType,
                transaction_reference: null,
                delivery_address_id: null,
                delivery_man_id: driverId,
                order_type: 'delivery',
                restaurant_id: null,
                created_at: o.createdAt?.toISOString() || new Date().toISOString(),
                updated_at: o.updatedAt?.toISOString() || new Date().toISOString(),
                delivery_charge: 0,
                original_delivery_charge: 0,
                dm_tips: 0,
                schedule_at: null,
                restaurant_name: restaurantAddress.split(',')[0] || 'Restaurant',
                restaurant_discount_amount: 0,
                restaurant_address: restaurantAddress,
                restaurant_lat: typeof o.pickup === 'object' && o.pickup !== null ? String(o.pickup.lat || '') : '',
                restaurant_lng: typeof o.pickup === 'object' && o.pickup !== null ? String(o.pickup.lng || '') : '',
                restaurant_logo_full_url: null,
                restaurant_phone: null,
                restaurant_delivery_time: null,
                vendor_id: null,
                details_count: items.length,
                order_note: null,
                delivery_address: {
                    id: null,
                    address_type: 'home',
                    contact_person_number: null,
                    address: deliveryAddressText,
                    latitude: typeof o.dropoff === 'object' && o.dropoff !== null ? String(o.dropoff.lat || '') : '',
                    longitude: typeof o.dropoff === 'object' && o.dropoff !== null ? String(o.dropoff.lng || '') : '',
                    zone_id: null,
                    zone_ids: null,
                    created_at: null,
                    updated_at: null,
                    user_id: null,
                    contact_person_name: null,
                    road: null,
                    house: null,
                    floor: null,
                    postal_code: null,
                    address_label: null
                },
                customer: null,
                processing_time: null,
                chat_permission: null,
                restaurant_model: null,
                cutlery: false,
                unavailable_item_note: null,
                delivery_instruction: null,
                order_proof_full_url: null,
                payments: null,
                restaurant_discount: 0,
                tax_status: false,
                additional_charge: 0,
                extra_packaging_amount: 0,
                ref_bonus_amount: 0,
                bring_change_amount: 0,
                external_ref: o.externalRef,
                items: o.items
            };
        });
        return {
            orders: transformedOrders,
            total_size: total,
            limit: limit.toString(),
            offset: offset.toString(),
            order_count: {
                all: allCount,
                delivered: statusCounts.find((c) => c.status === 'delivered')?.count || 0,
                canceled: statusCounts.find((c) => c.status === 'canceled')?.count || 0,
                refund_requested: statusCounts.find((c) => c.status === 'refund_requested')?.count || 0,
                refunded: statusCounts.find((c) => c.status === 'refunded')?.count || 0,
                refund_request_canceled: statusCounts.find((c) => c.status === 'refund_request_canceled')?.count || 0
            }
        };
    }
};
OrdersService = __decorate([
    Injectable(),
    __param(0, InjectRepository(OrderEntity)),
    __param(2, Inject(forwardRef(() => getRoutesService()))),
    __metadata("design:paramtypes", [Repository,
        DriversService, Function])
], OrdersService);
export { OrdersService };
