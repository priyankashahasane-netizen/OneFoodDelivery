import { Injectable, Inject, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { DriverEntity } from '../drivers/entities/driver.entity.js';
import { DriversService } from '../drivers/drivers.service.js';
import type { RoutesService } from '../routes/routes.service.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { WalletService } from '../wallet/wallet.service.js';
import { OrderEntity } from './entities/order.entity.js';
import { UpsertOrderDto } from './dto/upsert-order.dto.js';
import { ListOrdersDto } from './dto/list-orders.dto.js';

// Lazy class references to avoid circular dependency
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const getRoutesService = () => {
  return require('../routes/routes.service.js').RoutesService;
};
const getNotificationsService = () => {
  return require('../notifications/notifications.service.js').NotificationsService;
};
const getWalletService = () => {
  return require('../wallet/wallet.service.js').WalletService;
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
    private readonly driversService: DriversService,
    @Inject(forwardRef(() => getRoutesService()))
    private readonly routesService: RoutesService,
    @Inject(forwardRef(() => getNotificationsService()))
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => getWalletService()))
    private readonly walletService: WalletService
  ) {}

  async listOrders(filters: ListOrdersDto) {
    const { page = 1, pageSize = 25, status, paymentType, driverId, assigned, orderType } = filters;
    
    const queryBuilder = this.ordersRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.driver', 'driver')
      .orderBy('order.createdAt', 'DESC');

    // Apply filters
    if (status) {
      // Normalize 'canceled' to 'cancelled' (standard spelling)
      const normalizedStatus = status === 'canceled' ? 'cancelled' : status;
      queryBuilder.andWhere('order.status = :status', { status: normalizedStatus });
    }

    if (paymentType) {
      queryBuilder.andWhere('order.paymentType = :paymentType', { paymentType });
    }

    if (driverId) {
      queryBuilder.andWhere('order.driverId = :driverId', { driverId });
    }

    if (assigned !== undefined) {
      if (assigned) {
        queryBuilder.andWhere('order.driverId IS NOT NULL');
      } else {
        queryBuilder.andWhere('order.driverId IS NULL');
      }
    }

    if (orderType) {
      queryBuilder.andWhere('order.orderType = :orderType', { orderType });
    }

    // Apply pagination
    queryBuilder.take(pageSize).skip((page - 1) * pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();
    
    return { items, total, page, pageSize };
  }

  async findById(orderId: string) {
    let order: OrderEntity | null = null;
    
    // Check if orderId is a valid UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    
    if (isUUID) {
      // Try to find by UUID directly
      try {
        order = await this.ordersRepository.findOne({ 
          where: { id: orderId }, 
          relations: ['driver'] 
        });
        if (order) {
          console.log(`Order found by UUID: ${orderId}`);
        }
      } catch (error) {
        console.log(`UUID query failed for ${orderId}, trying numeric fallback: ${error}`);
      }
    }

    // If not found by UUID (or not a UUID), try to find by numeric ID (hash of UUID)
    if (!order) {
      const numericId = parseInt(orderId, 10);
      if (!isNaN(numericId)) {
        // Get all orders and find the one with matching numeric ID
        try {
          const allOrders = await this.ordersRepository.find({
            relations: ['driver']
          });
          
          for (const o of allOrders) {
            const orderNumericId = Math.abs(o.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000000;
            if (orderNumericId === numericId) {
              order = o;
              console.log(`Order found by numeric ID: ${numericId} -> UUID: ${o.id}`);
              break;
            }
          }
        } catch (error) {
          console.error(`Error finding order by numeric ID: ${error}`);
        }
      }
    }

    if (!order) {
      console.error(`Order ${orderId} not found (UUID: ${isUUID}, numeric: ${parseInt(orderId, 10)})`);
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  async findByIdForDriver(orderId: string, driverId: string) {
    let order: OrderEntity | null = null;
    
    // Check if orderId is a valid UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    
    if (isUUID) {
      // Try to find by UUID directly
      try {
        order = await this.ordersRepository.findOne({ 
          where: { id: orderId, driverId }, 
          relations: ['driver'] 
        });
      } catch (error) {
        // If UUID query fails, log and continue to fallback
        console.log(`UUID query failed for ${orderId}, trying numeric fallback`);
      }
    }

    // If not found by UUID (or not a UUID), try to find by numeric ID (hash of UUID)
    if (!order) {
      const numericId = parseInt(orderId, 10);
      if (!isNaN(numericId)) {
        // Get all orders for this driver and find the one with matching numeric ID
        try {
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
        } catch (error) {
          console.error(`Error finding order by numeric ID: ${error}`);
        }
      }
    }

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found or not assigned to driver`);
    }
    return this.transformOrderForFlutter(order, driverId);
  }

  private transformOrderForFlutter(order: OrderEntity, driverId: string) {
    // Extract address from pickup/dropoff
    const restaurantAddress = typeof order.pickup === 'object' && order.pickup !== null ? (order.pickup as any).address || '' : '';
    const deliveryAddressText = typeof order.dropoff === 'object' && order.dropoff !== null ? (order.dropoff as any).address || '' : '';
    
    // Calculate order amount from items
    const items = (order.items as any[]) || [];
    console.log(`[transformOrderForFlutter] Order ${order.id}: items count = ${items.length}, items =`, JSON.stringify(items, null, 2));
    
    if (items.length === 0) {
      console.warn(`[transformOrderForFlutter] WARNING: Order ${order.id} has no items! items value:`, order.items);
    }
    
    const orderAmount = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    
    // Create a numeric ID from UUID hash (for compatibility)
    const numericId = Math.abs(order.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000000;
    
    const result = {
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
      order_type: order.orderType || 'regular', // Use order.orderType from database
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
      restaurant_lat: typeof order.pickup === 'object' && order.pickup !== null ? String((order.pickup as any).lat || '') : '',
      restaurant_lng: typeof order.pickup === 'object' && order.pickup !== null ? String((order.pickup as any).lng || '') : '',
      restaurant_logo_full_url: null,
      restaurant_phone: null,
      restaurant_delivery_time: null,
      vendor_id: null,
      details_count: items.length,
      order_note: null,
      delivery_address: {
        id: null,
        address_type: 'home',
        contact_person_number: order.customerPhone || null,
        address: deliveryAddressText,
        latitude: typeof order.dropoff === 'object' && order.dropoff !== null ? String((order.dropoff as any).lat || '') : '',
        longitude: typeof order.dropoff === 'object' && order.dropoff !== null ? String((order.dropoff as any).lng || '') : '',
        zone_id: null,
        zone_ids: null,
        created_at: null,
        updated_at: null,
        user_id: null,
        contact_person_name: order.customerName || null,
        road: null,
        house: null,
        floor: null,
        postal_code: null,
        address_label: null,
      },
      customer: order.customerName || order.customerPhone || order.customerEmail ? {
        id: null,
        f_name: order.customerName?.split(' ')[0] || null,
        l_name: order.customerName?.split(' ').slice(1).join(' ') || null,
        phone: order.customerPhone || null,
        email: order.customerEmail || null,
        image_full_url: null,
        created_at: null,
        updated_at: null,
        cm_firebase_token: null,
      } : null,
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
      items: items.map((item: any) => ({
        name: item.name || 'Item',
        price: item.price || 0,
        quantity: item.quantity || 1,
        add_ons: item.addOns || [],
      })),
      // Order details format for Flutter app
      order_details: items.map((item: any, index: number) => {
        const orderDetail = {
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
          add_ons: (item.addOns || []).map((addon: any) => ({
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
          total_add_on_price: (item.addOns || []).reduce((sum: number, addon: any) => sum + ((addon.price || 0) * (addon.quantity || 1)), 0),
        };
        console.log(`[transformOrderForFlutter] Created order_detail[${index}]:`, JSON.stringify(orderDetail, null, 2));
        return orderDetail;
      }),
    };
    
    console.log(`[transformOrderForFlutter] Order ${order.id}: Returning order_details count = ${result.order_details.length}`);
    return result;
  }
    console.log(`[transformOrderForFlutter] Order ${order.id}: Returning order_details count = ${result.order_details.length}`);
    return result;
  }

  async create(payload: UpsertOrderDto) {
    // Set default status and orderType if not provided
    const orderData: DeepPartial<OrderEntity> = {
      ...payload,
      status: payload.status || 'created',
      orderType: payload.orderType || 'regular',
    };
    const entity = this.ordersRepository.create(orderData);
    return this.ordersRepository.save(entity);
  }

  async upsert(orderId: string, payload: UpsertOrderDto) {
    const existing = await this.ordersRepository.findOne({ where: { id: orderId } });
    const partial: DeepPartial<OrderEntity> = { id: orderId, ...payload };
    const entity = this.ordersRepository.merge(existing ?? this.ordersRepository.create(), partial);
    return this.ordersRepository.save(entity);
  }

  async updateOrderType(orderId: string, orderType: 'regular' | 'subscription') {
    const order = await this.findById(orderId);
    order.orderType = orderType;
    return this.ordersRepository.save(order);
  }

  async assignDriver(orderId: string, driverId: string) {
    const order = await this.findById(orderId);
    
    // Trust the JWT token - driverId is already validated by authentication
    // We don't need to fetch the driver entity again since the JWT is trusted
    // This avoids UUID parsing errors and unnecessary database queries
    order.driverId = driverId;
    order.status = 'assigned';
    order.assignedAt = new Date();

    // set tracking URL if not already present
    if (!order.trackingUrl) {
      const base = process.env.TRACKING_BASE_URL ?? 'http://localhost:3001/track';
      order.trackingUrl = `${base}/${order.id}`;
    }

    await this.ordersRepository.save(order);

    await this.routesService.enqueueOptimizationForDriver(driverId);

    // Send notification to driver about the assignment
    // Don't await to avoid blocking the response, but handle errors
    this.notificationsService.broadcastAssignment(orderId, driverId).catch((error) => {
      // Log error but don't throw - notification failure shouldn't break assignment
      console.error('Failed to send assignment notification:', error);
    });

    return order;
  }

  async unassignDriver(orderId: string) {
    const order = await this.findById(orderId);
    
    const previousDriverId = order.driverId;
    
    order.driver = null;
    order.driverId = null;
    order.assignedAt = null;
    
    // Reset status to 'pending' when unassigned from admin side
    order.status = 'pending';

    await this.ordersRepository.save(order);

    // Re-optimize routes for the previous driver if they had one
    if (previousDriverId) {
      await this.routesService.enqueueOptimizationForDriver(previousDriverId);
    }

    return order;
  }

  async delete(orderId: string) {
    const order = await this.findById(orderId);
    
    const previousDriverId = order.driverId;
    
    await this.ordersRepository.remove(order);

    // Re-optimize routes for the previous driver if they had one
    if (previousDriverId) {
      await this.routesService.enqueueOptimizationForDriver(previousDriverId);
    }

    return { success: true, message: 'Order deleted successfully' };
  }

  async updateStatus(orderId: string, status: string, payload?: Partial<Pick<OrderEntity, 'trackingUrl'>>, driverId?: string, cancellationSource?: string, cancellationReason?: string) {
    let order: OrderEntity | null = null;
    
    // Check if orderId is a valid UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    
    if (isUUID) {
      // Try to find by UUID directly
      try {
        order = await this.ordersRepository.findOne({ 
          where: { id: orderId }, 
          relations: ['driver'] 
        });
        if (order) {
          console.log(`Order found by UUID: ${orderId}, current status: ${order.status}`);
        }
      } catch (error) {
        console.log(`UUID query failed for ${orderId}, trying numeric fallback: ${error}`);
      }
    }

    // If not found by UUID (or not a UUID), try to find by numeric ID (hash of UUID)
    if (!order) {
      const numericId = parseInt(orderId, 10);
      if (!isNaN(numericId)) {
        // Get all orders and find the one with matching numeric ID
        try {
          const allOrders = await this.ordersRepository.find({
            relations: ['driver']
          });
          
          for (const o of allOrders) {
            const orderNumericId = Math.abs(o.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000000;
            if (orderNumericId === numericId) {
              order = o;
              console.log(`Order found by numeric ID: ${numericId} -> UUID: ${o.id}, current status: ${o.status}`);
              break;
            }
          }
        } catch (error) {
          console.error(`Error finding order by numeric ID: ${error}`);
        }
      }
    }

    if (!order) {
      console.error(`Order ${orderId} not found (UUID: ${isUUID}, numeric: ${parseInt(orderId, 10)})`);
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const oldStatus = order.status;
    
    // Normalize status: accept both 'cancelled' and 'canceled' but store as 'cancelled'
    const normalizedStatus = status.toLowerCase() === 'canceled' ? 'cancelled' : status;
    order.status = normalizedStatus;
    
    // Handle cancellation fields if status is being changed to cancelled
    if (normalizedStatus === 'cancelled' || status.toLowerCase() === 'canceled') {
      if (cancellationSource) {
        order.cancellationSource = cancellationSource;
      }
      if (cancellationReason) {
        order.cancellationReason = cancellationReason;
      }
      // Ensure driverId is preserved when cancelling (don't unassign driver on cancellation)
      // This allows cancelled orders to appear in driver's "My Orders" list
      if (!order.driverId && driverId) {
        // If order doesn't have a driver but we have driverId from token, assign it
        // This handles cases where order was cancelled before being accepted
        order.driverId = driverId;
        console.log(`Order ${orderId} assigned to driver ${driverId} during cancellation`);
      }
    }
    
    // If status is being changed to "accepted" and order doesn't have a driver, assign the authenticated driver
    if (status === 'accepted' && order.driverId == null && driverId) {
      order.driverId = driverId;
      if (!order.assignedAt) {
        order.assignedAt = new Date();
      }
      console.log(`Order ${orderId} assigned to driver ${driverId} (status changed to accepted)`);
      
      // Set tracking URL if not already present
      if (!order.trackingUrl) {
        const base = process.env.TRACKING_BASE_URL ?? 'http://localhost:3001/track';
        order.trackingUrl = `${base}/${order.id}`;
      }
      
      // Trigger route optimization for the driver
      this.routesService.enqueueOptimizationForDriver(driverId).catch((error) => {
        console.error('Failed to optimize routes for driver:', error);
      });
    }
    
    // If status is being changed to "pending" and order was assigned, unassign the driver
    if (status === 'pending' && order.driverId != null) {
      const previousDriverId = order.driverId;
      order.driver = null;
      order.driverId = null;
      order.assignedAt = null;
      console.log(`Order ${orderId} unassigned from driver ${previousDriverId} (status changed to pending)`);
      
      // Re-optimize routes for the previous driver
      if (previousDriverId) {
        this.routesService.enqueueOptimizationForDriver(previousDriverId).catch((error) => {
          console.error('Failed to re-optimize routes for driver:', error);
        });
      }
    }
    
    if (payload?.trackingUrl) {
      order.trackingUrl = payload.trackingUrl;
    }
    
    // Handle cash_on_delivery when order status becomes "delivered"
    if (normalizedStatus === 'delivered' && order.paymentType === 'cash_on_delivery' && order.driverId) {
      try {
        // Calculate order amount from items
        const items = (order.items as any[]) || [];
        const orderAmount = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
        
        if (orderAmount > 0) {
          console.log(`Processing cash_on_delivery for order ${orderId}: deducting ${orderAmount} from wallet and adding to cash in hand`);
          
          // Deduct from wallet balance
          const walletResult = await this.walletService.deductFromWallet(
            order.driverId,
            orderAmount,
            order.id,
            `Cash on delivery order amount deducted for order ${orderId}`
          );
          
          if (walletResult.success) {
            // Get current cash in hand from driver metadata
            const driver = await this.driversService.findById(order.driverId);
            const currentCashInHand = (driver.metadata as any)?.cashInHands || 0;
            const newCashInHand = parseFloat(currentCashInHand.toString()) + orderAmount;
            
            // Update cash in hand in driver metadata
            await this.driversService.updateMetadata(order.driverId, {
              cashInHands: newCashInHand
            });
            
            console.log(`Successfully processed cash_on_delivery: deducted ${orderAmount} from wallet, added to cash in hand (new total: ${newCashInHand})`);
          } else {
            console.error(`Failed to deduct from wallet for cash_on_delivery order ${orderId}: ${walletResult.message}`);
            // Continue with order status update even if wallet deduction fails
            // This allows the order to be marked as delivered, but the financial transaction may need manual review
          }
        } else {
          console.warn(`Order ${orderId} has zero amount, skipping cash_on_delivery processing`);
        }
      } catch (error) {
        console.error(`Error processing cash_on_delivery for order ${orderId}:`, error);
        // Continue with order status update even if cash_on_delivery processing fails
        // This ensures the order can still be marked as delivered
      }
    }
    
    // Set deliveredAt timestamp when status becomes delivered
    if (normalizedStatus === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }
    
    const savedOrder = await this.ordersRepository.save(order);
    console.log(`Order status updated: ${orderId} from "${oldStatus}" to "${normalizedStatus}"${driverId && normalizedStatus === 'accepted' && savedOrder.driverId ? ` (driver assigned: ${savedOrder.driverId})` : ''}${normalizedStatus === 'cancelled' && savedOrder.cancellationReason ? ` (cancellation reason: ${savedOrder.cancellationReason})` : ''}`);
    
    return savedOrder;
  }

  /**
   * Get raw active orders (OrderEntity) for internal use (e.g., route optimization)
   */
  async getActiveOrdersByDriverRaw(driverId: string): Promise<OrderEntity[]> {
    // Exclude completed statuses - handle both 'cancelled' and 'cancelled' spellings
    const excludedStatuses = ['delivered', 'cancelled', 'cancelled', 'failed', 'refunded', 'refund_requested', 'refund_request_cancelled'];
    
    // First, let's check what orders exist for this driver (for debugging)
    const allDriverOrders = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.driverId = :driverId', { driverId })
      .getMany();
    
    console.log(`getActiveOrdersByDriverRaw: Total orders for driver ${driverId}: ${allDriverOrders.length}`);
    if (allDriverOrders.length > 0) {
      const statusBreakdown = allDriverOrders.reduce((acc, o) => {
        const status = o.status?.toLowerCase() || 'null';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`getActiveOrdersByDriverRaw: Status breakdown for driver:`, statusBreakdown);
    }
    
    const orders = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.driverId = :driverId', { driverId })
      .andWhere('LOWER(order.status) NOT IN (:...statuses)', { 
        statuses: excludedStatuses.map(s => s.toLowerCase())
      })
      .orderBy('order.assignedAt', 'DESC')
      .getMany();
    
    // Debug logging
    console.log(`getActiveOrdersByDriverRaw: Found ${orders.length} active orders for driver ${driverId} (after excluding final statuses)`);
    if (orders.length > 0) {
      const statusBreakdown = orders.reduce((acc, o) => {
        const status = o.status?.toLowerCase() || 'null';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`getActiveOrdersByDriverRaw: Active order status breakdown:`, statusBreakdown);
      const orderIds = orders.map(o => `${o.id.substring(0, 8)}:${o.status}`).join(', ');
      console.log(`getActiveOrdersByDriverRaw: Order IDs and statuses: ${orderIds}`);
    } else if (allDriverOrders.length > 0) {
      console.warn(`getActiveOrdersByDriverRaw: WARNING - Driver has ${allDriverOrders.length} orders but ${orders.length} active orders. All orders may be in excluded statuses.`);
    }
    
    return orders;
  }

  async getActiveOrdersByDriver(driverId: string) {
    const orders = await this.getActiveOrdersByDriverRaw(driverId);
    
    console.log(`getActiveOrdersByDriver: Transforming ${orders.length} orders for driver ${driverId}`);
    if (orders.length > 0) {
      const statusBreakdown = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`getActiveOrdersByDriver: Status breakdown:`, statusBreakdown);
    }

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

  async getAvailableOrders(driverId?: string) {
    // Return orders that are:
    // 1. Unassigned (driverId IS NULL) - available for any driver
    // 2. Assigned to the authenticated driver with status 'assigned' - requests for that driver
    const qb = this.ordersRepository.createQueryBuilder('order')
      .where('order.driverId IS NULL');
    
    // If driverId is provided, also include orders assigned to that driver with status 'assigned'
    if (driverId && driverId !== 'demo-driver-id') {
      qb.orWhere('(order.driverId = :driverId AND order.status = :assignedStatus)', {
        driverId: driverId,
        assignedStatus: 'assigned'
      });
    }
    
    qb.orderBy('order.createdAt', 'DESC')
      .take(50); // Limit to 50 most recent orders
    
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
        uuid: o.id, // Include the actual UUID for API calls
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

    // Define all order statuses for My Orders page
    // Includes both active statuses and completed statuses
    const allMyOrderStatuses = [
      'accepted', 'confirmed', 'processing', 'handover', 'picked_up', 'in_transit',
      'delivered', 'cancelled', 'refund_requested', 'refunded', 'refund_request_cancelled'
    ];

    const qb = this.ordersRepository
      .createQueryBuilder('order')
      .where('order.driverId = :driverId', { driverId })
      .orderBy('order.createdAt', 'DESC');

    // Filter by status if not 'all'
    if (status !== 'all') {
      // Normalize 'canceled' to 'cancelled' if frontend sends old spelling
      const normalizedStatus = status === 'canceled' ? 'cancelled' : status;
      qb.andWhere('order.status = :status', { status: normalizedStatus });
      if (normalizedStatus === 'cancelled') {
        console.log(`Querying cancelled orders for driver ${driverId}`);
      }
    } else {
      // For 'all', show all statuses (both active and completed)
      qb.andWhere('order.status IN (:...statuses)', { statuses: allMyOrderStatuses });
    }

    // Get total count for pagination
    const total = await qb.getCount();

    // Apply pagination
    const skip = (offset - 1) * limit;
    qb.skip(skip).take(limit);

    const orders = await qb.getMany();
    console.log(`Found ${orders.length} orders with status filter '${status}' for driver ${driverId}`);
    if (orders.length > 0 && (status === 'cancelled' || status === 'canceled')) {
      console.log(`Cancelled order statuses: ${orders.map(o => o.status).join(', ')}`);
    }

    // Get counts for each status in the order they appear in the UI
    // All statuses use 'cancelled' spelling
    const statusesForCount = [
      'accepted', 'confirmed', 'processing', 'handover', 'picked_up', 'in_transit',
      'delivered', 'cancelled', 'refund_requested', 'refunded', 'refund_request_cancelled'
    ];
    const countPromises = statusesForCount.map(async (s) => {
      const count = await this.ordersRepository.count({
        where: { driverId, status: s }
      });
      return { status: s, count };
    });
    const allCount = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.driverId = :driverId', { driverId })
      .andWhere('order.status IN (:...statuses)', { statuses: allMyOrderStatuses })
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
      
      // Status is already 'cancelled' in database, return as-is
      const normalizedStatus = o.status;
      
      return {
        id: numericId,
        user_id: null,
        order_amount: orderAmount,
        coupon_discount_amount: 0,
        payment_status: 'unpaid',
        order_status: normalizedStatus,
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
        accepted: statusCounts.find((c) => c.status === 'accepted')?.count || 0,
        confirmed: statusCounts.find((c) => c.status === 'confirmed')?.count || 0,
        processing: statusCounts.find((c) => c.status === 'processing')?.count || 0,
        handover: statusCounts.find((c) => c.status === 'handover')?.count || 0,
        picked_up: statusCounts.find((c) => c.status === 'picked_up')?.count || 0,
          in_transit: statusCounts.find((c) => c.status === 'in_transit')?.count || 0,
          delivered: statusCounts.find((c) => c.status === 'delivered')?.count || 0,
          cancelled: statusCounts.find((c) => c.status === 'cancelled')?.count || 0,
          refund_requested: statusCounts.find((c) => c.status === 'refund_requested')?.count || 0,
          refunded: statusCounts.find((c) => c.status === 'refunded')?.count || 0,
          refund_request_cancelled: statusCounts.find((c) => c.status === 'refund_request_cancelled')?.count || 0
      }
    };
  }
}

