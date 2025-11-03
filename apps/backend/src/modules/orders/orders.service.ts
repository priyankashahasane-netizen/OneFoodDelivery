import { Injectable, Inject, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { DriverEntity } from '../drivers/entities/driver.entity.js';
import { DriversService } from '../drivers/drivers.service.js';
import type { RoutesService } from '../routes/routes.service.js';
import { OrderEntity } from './entities/order.entity.js';
import { UpsertOrderDto } from './dto/upsert-order.dto.js';

// Lazy class reference to avoid circular dependency
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const getRoutesService = () => {
  return require('../routes/routes.service.js').RoutesService;
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
    private readonly driversService: DriversService,
    @Inject(forwardRef(() => getRoutesService()))
    private readonly routesService: RoutesService
  ) {}

  async listOrders(pagination: PaginationQueryDto) {
    const { page = 1, pageSize = 25 } = pagination;
    const [items, total] = await this.ordersRepository.findAndCount({
      take: pageSize,
      skip: (page - 1) * pageSize,
      order: { createdAt: 'DESC' }
    });
    return { items, total, page, pageSize };
  }

  async findById(orderId: string) {
    const order = await this.ordersRepository.findOne({ where: { id: orderId }, relations: ['driver'] });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  async upsert(orderId: string, payload: UpsertOrderDto) {
    const existing = await this.ordersRepository.findOne({ where: { id: orderId } });
    const partial: DeepPartial<OrderEntity> = { id: orderId, ...payload };
    const entity = this.ordersRepository.merge(existing ?? this.ordersRepository.create(), partial);
    return this.ordersRepository.save(entity);
  }

  async assignDriver(orderId: string, driverId: string) {
    const order = await this.findById(orderId);
    const driver = await this.driversService.findById(driverId);

    order.driver = driver as DriverEntity;
    order.driverId = driver.id;
    order.status = 'assigned';
    order.assignedAt = new Date();

    // set tracking URL if not already present
    if (!order.trackingUrl) {
      const base = process.env.TRACKING_BASE_URL ?? 'http://localhost:3001/track';
      order.trackingUrl = `${base}/${order.id}`;
    }

    await this.ordersRepository.save(order);

    await this.routesService.enqueueOptimizationForDriver(driver.id);

    return order;
  }

  async updateStatus(orderId: string, status: string, payload?: Partial<Pick<OrderEntity, 'trackingUrl'>>) {
    const order = await this.findById(orderId);
    order.status = status;
    if (payload?.trackingUrl) {
      order.trackingUrl = payload.trackingUrl;
    }
    return this.ordersRepository.save(order);
  }

  async getActiveOrdersByDriver(driverId: string) {
    return this.ordersRepository
      .createQueryBuilder('order')
      .where('order.driverId = :driverId', { driverId })
      .andWhere('order.status NOT IN (:...statuses)', { statuses: ['delivered', 'canceled', 'failed', 'refunded', 'refund_requested', 'refund_request_canceled'] })
      .orderBy('order.assignedAt', 'DESC')
      .getMany();
  }

  async getAvailableOrders(driverId?: string) {
    // Orders not assigned (available for any driver to pick up)
    // Return unassigned orders regardless of status for now
    const qb = this.ordersRepository.createQueryBuilder('order')
      .where('order.driverId IS NULL')
      .orderBy('order.createdAt', 'DESC')
      .take(50); // Limit to 50 most recent unassigned orders
    
    const orders = await qb.getMany();
    
    // Transform orders to match Flutter app's expected format
    const transformedOrders = orders.map((o) => {
      // Extract address from pickup/dropoff
      const restaurantAddress = typeof o.pickup === 'object' && o.pickup !== null ? (o.pickup as any).address || '' : '';
      const deliveryAddressText = typeof o.dropoff === 'object' && o.dropoff !== null ? (o.dropoff as any).address || '' : '';
      
      // Calculate order amount from items
      const items = (o.items as any[]) || [];
      const orderAmount = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
      
      // Create a numeric ID from UUID hash (for compatibility)
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
        restaurant_lat: typeof o.pickup === 'object' && o.pickup !== null ? String((o.pickup as any).lat || '') : '',
        restaurant_lng: typeof o.pickup === 'object' && o.pickup !== null ? String((o.pickup as any).lng || '') : '',
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
          latitude: typeof o.dropoff === 'object' && o.dropoff !== null ? (o.dropoff as any).lat || 0 : 0,
          longitude: typeof o.dropoff === 'object' && o.dropoff !== null ? (o.dropoff as any).lng || 0 : 0,
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
        items: items.map((item: any) => ({
          name: item.name || 'Item',
          price: item.price || 0,
          quantity: item.quantity || 1,
        })),
      };
    });
    
    return transformedOrders;
  }

  async getCompletedOrdersByDriver(
    driverId: string,
    options: {
      offset?: number;
      limit?: number;
      status?: string;
    }
  ) {
    const offset = options.offset || 1;
    const limit = options.limit || 10;
    const status = options.status || 'all';

    // Define completed order statuses
    const completedStatuses = ['delivered', 'canceled', 'refund_requested', 'refunded', 'refund_request_canceled'];

    const qb = this.ordersRepository
      .createQueryBuilder('order')
      .where('order.driverId = :driverId', { driverId })
      .orderBy('order.createdAt', 'DESC');

    // Filter by status if not 'all'
    if (status !== 'all') {
      qb.andWhere('order.status = :status', { status });
    } else {
      // For 'all', only show completed statuses
      qb.andWhere('order.status IN (:...statuses)', { statuses: completedStatuses });
    }

    // Get total count for pagination
    const total = await qb.getCount();

    // Apply pagination
    const skip = (offset - 1) * limit;
    qb.skip(skip).take(limit);

    const orders = await qb.getMany();

    // Get counts for each status
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

    // Transform orders to match Flutter app's expected format
    const transformedOrders = orders.map((o, index) => {
      // Extract address from pickup/dropoff
      const restaurantAddress = typeof o.pickup === 'object' && o.pickup !== null ? (o.pickup as any).address || '' : '';
      const deliveryAddressText = typeof o.dropoff === 'object' && o.dropoff !== null ? (o.dropoff as any).address || '' : '';
      
      // Calculate order amount from items
      const items = (o.items as any[]) || [];
      const orderAmount = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
      
      // Create a numeric ID from UUID hash (for compatibility)
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
        restaurant_lat: typeof o.pickup === 'object' && o.pickup !== null ? String((o.pickup as any).lat || '') : '',
        restaurant_lng: typeof o.pickup === 'object' && o.pickup !== null ? String((o.pickup as any).lng || '') : '',
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
          latitude: typeof o.dropoff === 'object' && o.dropoff !== null ? String((o.dropoff as any).lat || '') : '',
          longitude: typeof o.dropoff === 'object' && o.dropoff !== null ? String((o.dropoff as any).lng || '') : '',
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
        // Additional fields from backend
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
}

