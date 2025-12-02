import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DriversService } from '../drivers/drivers.service.js';
import type { OrdersService } from '../orders/orders.service.js';
import { OrderEntity } from '../orders/entities/order.entity.js';
import { RoutePlanEntity } from './entities/route-plan.entity.js';
import { OptimoRouteClient } from '../../integrations/optimoroute.client.js';

// Lazy class reference to avoid circular dependency
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const getOrdersService = () => {
  return require('../orders/orders.service.js').OrdersService;
};

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(
    @InjectRepository(RoutePlanEntity)
    private readonly routePlansRepository: Repository<RoutePlanEntity>,
    private readonly driversService: DriversService,
    private readonly optimoRouteClient: OptimoRouteClient,
    @Inject(forwardRef(() => getOrdersService()))
    private readonly ordersService: OrdersService
  ) {}

  async enqueueOptimizationForDriver(driverId: string) {
    // placeholder for background job enqueue
    return this.optimizeForDriver(driverId);
  }

  async optimizeForDriver(driverId: string, stopsOverride?: Array<{ lat: number; lng: number; orderId?: string }>) {
    let driver = null;
    try {
      driver = await this.driversService.findById(driverId);
    } catch (error) {
      // Driver not found, continue with provided stops
    }

    let stops = stopsOverride ?? [];
    if (!stops.length && driver) {
      try {
        // Use raw orders method to get OrderEntity with pickup/dropoff properties
        // Type assertion needed due to circular dependency with forwardRef
        const active = await (this.ordersService as OrdersService & { getActiveOrdersByDriverRaw: (driverId: string) => Promise<OrderEntity[]> }).getActiveOrdersByDriverRaw(driverId);
        stops = active.flatMap((o: OrderEntity) => {
          if (o.pickup && typeof o.pickup === 'object' && 'lat' in o.pickup && 'lng' in o.pickup) {
            return [
              { lat: (o.pickup as any).lat, lng: (o.pickup as any).lng, orderId: String(o.id) }, 
              { lat: (o.dropoff as any).lat, lng: (o.dropoff as any).lng, orderId: String(o.id) }
            ];
          }
          return [];
        });
      } catch (error) {
        // Failed to get orders, continue with default stops
      }
    }
    
    if (!stops.length && driver) {
      const defaultStops = driver.latitude && driver.longitude ? [{ lat: driver.latitude, lng: driver.longitude }] : [];
      stops = defaultStops;
    }
    
    if (!stops.length) {
      // Return a basic route plan with empty stops instead of throwing
      // This allows the endpoint to work even without stops
      return this.routePlansRepository.save(
        this.routePlansRepository.create({
          driverId: driverId || null,
          stops: [],
          totalDistanceKm: 0,
          estimatedDurationSec: null,
          etaPerStop: null,
          sequence: null,
          polyline: null,
          rawResponse: { mock: true, message: 'No stops provided' },
          provider: 'optimoroute',
          status: 'planned'
        })
      );
    }

    let response;
    try {
      response = await this.optimoRouteClient.optimizeRoute({ driverId, stops });
    } catch (error) {
      // If optimization fails, create a basic plan with the stops
      response = {
        stops: stops,
        distanceKm: 0,
        etaPerStop: null,
        mock: true
      };
    }

    const plan = this.routePlansRepository.create({
      driverId: driverId || null,
      stops: response?.stops ?? stops,
      totalDistanceKm: response?.distanceKm ?? 0,
      estimatedDurationSec: response?.estimatedDuration ?? null,
      etaPerStop: response?.etaPerStop ? (Array.isArray(response.etaPerStop) ? response.etaPerStop.map(String) : null) : null,
      sequence: response?.sequence ?? null,
      polyline: response?.polyline ?? null,
      rawResponse: response ?? null,
      provider: 'optimoroute',
      status: 'planned'
    });
    return this.routePlansRepository.save(plan);
  }

  async getLatestPlanForDriver(driverId: string) {
    try {
      const plan = await this.routePlansRepository.findOne({ 
        where: { driverId }, 
        order: { createdAt: 'DESC' } 
      });
      return plan || null;
    } catch (error) {
      // Return null if query fails (e.g., table doesn't exist)
      return null;
    }
  }

  /**
   * Optimize route for subscription orders assigned to a driver using OptimoRoute API
   */
  async optimizeSubscriptionOrdersRoute(driverId: string) {
    let driver = null;
    try {
      driver = await this.driversService.findById(driverId);
    } catch (error) {
      throw new Error(`Driver not found: ${driverId}`);
    }

    // Get all active orders for the driver
    const activeOrders = await (this.ordersService as OrdersService & { 
      getActiveOrdersByDriverRaw: (driverId: string) => Promise<OrderEntity[]> 
    }).getActiveOrdersByDriverRaw(driverId);

    this.logger.log(`Found ${activeOrders.length} total active orders for driver ${driverId}`);
    
    // Log order type breakdown
    const orderTypeBreakdown = activeOrders.reduce((acc, o) => {
      const orderType = o.orderType || 'null';
      acc[orderType] = (acc[orderType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    this.logger.log(`Order type breakdown: ${JSON.stringify(orderTypeBreakdown)}`);

    // Filter only subscription orders
    const subscriptionOrders = activeOrders.filter(
      (o: OrderEntity) => o.orderType === 'subscription'
    );

    this.logger.log(`Filtered to ${subscriptionOrders.length} subscription orders`);

    if (subscriptionOrders.length === 0) {
      // Return empty route plan if no subscription orders
      return this.routePlansRepository.save(
        this.routePlansRepository.create({
          driverId: driverId,
          stops: [],
          totalDistanceKm: 0,
          estimatedDurationSec: null,
          etaPerStop: null,
          sequence: null,
          polyline: null,
          rawResponse: { mock: true, message: 'No subscription orders found' },
          provider: 'optimoroute',
          status: 'planned',
          meta: { orderType: 'subscription', orderCount: 0 }
        })
      );
    }

    // Transform orders to OptimoRoute format
    const optimoRouteOrders: Array<{
      orderId: string;
      pickup: { lat: number; lng: number; address: string };
      dropoff: { lat: number; lng: number; address: string };
    }> = [];

    for (const order of subscriptionOrders) {
      if (
        order.pickup && typeof order.pickup === 'object' && 
        'lat' in order.pickup && 'lng' in order.pickup &&
        order.dropoff && typeof order.dropoff === 'object' &&
        'lat' in order.dropoff && 'lng' in order.dropoff
      ) {
        optimoRouteOrders.push({
          orderId: String(order.id),
          pickup: {
            lat: (order.pickup as any).lat,
            lng: (order.pickup as any).lng,
            address: (order.pickup as any).address || 'Pickup Location',
          },
          dropoff: {
            lat: (order.dropoff as any).lat,
            lng: (order.dropoff as any).lng,
            address: (order.dropoff as any).address || 'Delivery Location',
          },
        });
      }
    }

    if (optimoRouteOrders.length === 0) {
      // Return empty route plan if no valid stops
      return this.routePlansRepository.save(
        this.routePlansRepository.create({
          driverId: driverId,
          stops: [],
          totalDistanceKm: 0,
          estimatedDurationSec: null,
          etaPerStop: null,
          sequence: null,
          polyline: null,
          rawResponse: { mock: true, message: 'No valid stops found in subscription orders' },
          provider: 'optimoroute',
          status: 'planned',
          meta: { orderType: 'subscription', orderCount: subscriptionOrders.length }
        })
      );
    }

    // Use driver's external ID or phone as OptimoRoute driver identifier
    const driverExternalId = driver.externalId || driver.phone || `DRIVER_${driverId.substring(0, 8)}`;

    // Optimize route using OptimoRoute API
    let response;
    try {
      response = await this.optimoRouteClient.optimizeSubscriptionOrdersRoute(
        optimoRouteOrders,
        driverExternalId
      );
    } catch (error: any) {
      this.logger.error(`OptimoRoute optimization failed: ${error.message}`);
      // If optimization fails, create a basic plan with the stops
      const allStops = optimoRouteOrders.flatMap(o => [
        { lat: o.pickup.lat, lng: o.pickup.lng, orderId: o.orderId, type: 'pickup' },
        { lat: o.dropoff.lat, lng: o.dropoff.lng, orderId: o.orderId, type: 'dropoff' }
      ]);
      
      response = {
        stops: allStops,
        distanceKm: 0,
        etaPerStop: null,
        sequence: allStops.map((_, i) => i),
        polyline: allStops.map(s => `${s.lat},${s.lng}`).join(';'),
        estimatedDuration: null,
        mock: true,
        error: error.message,
      };
    }

    // Extract order IDs from subscription orders
    const orderIds = subscriptionOrders.map(o => String(o.id));

    // Create and save route plan
    const plan = this.routePlansRepository.create({
      driverId: driverId,
      orderId: orderIds, // Store array of order IDs in order_id column
      stops: response?.stops ?? [],
      totalDistanceKm: response?.distanceKm ?? 0,
      estimatedDurationSec: response?.estimatedDuration ?? null,
      etaPerStop: response?.etaPerStop ? (Array.isArray(response.etaPerStop) ? response.etaPerStop.map(String) : null) : null,
      sequence: response?.sequence ?? null,
      polyline: response?.polyline ?? null,
      rawResponse: response ?? null,
      provider: 'optimoroute',
      status: 'planned',
      meta: { 
        orderType: 'subscription', 
        orderCount: subscriptionOrders.length,
        orderIds: orderIds // Also keep in meta for backward compatibility
      }
    });
    
    return this.routePlansRepository.save(plan);
  }

  /**
   * Get the latest route plan for subscription orders for a driver
   */
  async getLatestSubscriptionRouteForDriver(driverId: string) {
    try {
      // Get the latest route plan that has subscription orders metadata
      const plan = await this.routePlansRepository.findOne({
        where: { driverId },
        order: { createdAt: 'DESC' }
      });
      
      // Check if the plan is for subscription orders by checking metadata
      if (plan && plan.meta && (plan.meta as any).orderType === 'subscription') {
        return plan;
      }
      
      // If no specific subscription route found, try to optimize one
      return await this.optimizeSubscriptionOrdersRoute(driverId);
    } catch (error) {
      // Return null if query fails
      return null;
    }
  }
}

