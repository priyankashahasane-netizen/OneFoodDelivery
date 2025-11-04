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
    async findByIdForDriver(orderId, driverId) {
        let order = await this.ordersRepository.findOne({
            where: { id: orderId, driverId },
            relations: ['driver']
        });
        if (!order) {
            const numericId = parseInt(orderId, 10);
            if (!isNaN(numericId)) {
                const allOrders = await this.ordersRepository.find({
                    where: { driverId },
                    relations: ['driver']
                });
                for (const o of allOrders) {
                    const orderNumericId = Math.abs(o.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000000;
                    if (orderNumericId === numericId) {
                        order = o;
                        break;
                    }
                }
            }
        }
        if (!order) {
            throw new NotFoundException(`Order ${orderId} not found or not assigned to driver`);
        }
        return this.transformOrderForFlutter(order, driverId);
    }
    transformOrderForFlutter(order, driverId) {
        const restaurantAddress = typeof order.pickup === 'object' && order.pickup !== null ? order.pickup.address || '' : '';
        const deliveryAddressText = typeof order.dropoff === 'object' && order.dropoff !== null ? order.dropoff.address || '' : '';
        const items = order.items || [];
        const orderAmount = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
        const numericId = Math.abs(order.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000000;
        return {
            id: numericId,
            user_id: null,
            order_amount: orderAmount,
            coupon_discount_amount: 0,
            payment_status: 'unpaid',
            order_status: order.status,
            total_tax_amount: 0,
            payment_method: order.paymentType || 'cash',
            transaction_reference: null,
            delivery_address_id: null,
            delivery_man_id: driverId,
            order_type: 'delivery',
            restaurant_id: null,
            created_at: order.createdAt?.toISOString() || new Date().toISOString(),
            updated_at: order.updatedAt?.toISOString() || new Date().toISOString(),
            delivery_charge: 0,
            original_delivery_charge: 0,
            dm_tips: 0,
            schedule_at: null,
            restaurant_name: restaurantAddress.split(',')[0] || 'Restaurant',
            restaurant_discount_amount: 0,
            restaurant_address: restaurantAddress,
            restaurant_lat: typeof order.pickup === 'object' && order.pickup !== null ? String(order.pickup.lat || '') : '',
            restaurant_lng: typeof order.pickup === 'object' && order.pickup !== null ? String(order.pickup.lng || '') : '',
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
                latitude: typeof order.dropoff === 'object' && order.dropoff !== null ? String(order.dropoff.lat || '') : '',
                longitude: typeof order.dropoff === 'object' && order.dropoff !== null ? String(order.dropoff.lng || '') : '',
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
                address_label: null,
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
            external_ref: order.externalRef || null,
            items: items.map((item) => ({
                name: item.name || 'Item',
                price: item.price || 0,
                quantity: item.quantity || 1,
                add_ons: item.addOns || [],
            })),
            order_details: items.map((item, index) => ({
                id: index + 1,
                food_id: item.foodId || null,
                order_id: numericId,
                price: item.price || 0,
                food_details: {
                    id: item.foodId || null,
                    name: item.name || 'Item',
                    description: item.description || null,
                    image_full_url: item.imageUrl || null,
                    price: item.price || 0,
                },
                variation: item.variations || [],
                add_ons: (item.addOns || []).map((addon) => ({
                    name: addon.name || 'Add-on',
                    price: addon.price || 0,
                    quantity: addon.quantity || 1,
                })),
                discount_on_food: item.discount || 0,
                discount_type: item.discountType || null,
                quantity: item.quantity || 1,
                tax_amount: item.taxAmount || 0,
                variant: item.variant || null,
                created_at: order.createdAt?.toISOString() || new Date().toISOString(),
                updated_at: order.updatedAt?.toISOString() || new Date().toISOString(),
                item_campaign_id: item.campaignId || null,
                total_add_on_price: (item.addOns || []).reduce((sum, addon) => sum + ((addon.price || 0) * (addon.quantity || 1)), 0),
            })),
        };
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
    async getActiveOrdersByDriverRaw(driverId) {
        return this.ordersRepository
            .createQueryBuilder('order')
            .where('order.driverId = :driverId', { driverId })
            .andWhere('order.status NOT IN (:...statuses)', { statuses: ['delivered', 'canceled', 'failed', 'refunded', 'refund_requested', 'refund_request_canceled'] })
            .orderBy('order.assignedAt', 'DESC')
            .getMany();
    }
    async getActiveOrdersByDriver(driverId) {
        const orders = await this.getActiveOrdersByDriverRaw(driverId);
        const transformedOrders = orders.map((o) => {
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
                payment_method: o.paymentType || 'cash',
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
                    address_label: null,
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
                external_ref: o.externalRef || null,
                items: items.map((item) => ({
                    name: item.name || 'Item',
                    price: item.price || 0,
                    quantity: item.quantity || 1,
                })),
            };
        });
        return transformedOrders;
    }
    async getAvailableOrders(driverId) {
        const qb = this.ordersRepository.createQueryBuilder('order')
            .where('order.driverId IS NULL')
            .orderBy('order.createdAt', 'DESC')
            .take(50);
        const orders = await qb.getMany();
        const transformedOrders = orders.map((o) => {
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
                payment_method: o.paymentType || 'cash',
                transaction_reference: null,
                delivery_address_id: null,
                delivery_man_id: null,
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
                    latitude: typeof o.dropoff === 'object' && o.dropoff !== null ? o.dropoff.lat || 0 : 0,
                    longitude: typeof o.dropoff === 'object' && o.dropoff !== null ? o.dropoff.lng || 0 : 0,
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
                    address_label: null,
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
                external_ref: o.externalRef || null,
                items: items.map((item) => ({
                    name: item.name || 'Item',
                    price: item.price || 0,
                    quantity: item.quantity || 1,
                })),
            };
        });
        return transformedOrders;
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
