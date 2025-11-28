import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SmartPathEntity } from './entities/smart-path.entity.js';
import { DriversService } from '../drivers/drivers.service.js';
import type { OrdersService } from '../orders/orders.service.js';
import type { RoutesService } from '../routes/routes.service.js';
import { OrderEntity } from '../orders/entities/order.entity.js';
import { areLocationsNearby, haversineDistanceMeters } from '../../common/utils/distance.util.js';

// Lazy class references to avoid circular dependency
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const getOrdersService = () => {
  return require('../orders/orders.service.js').OrdersService;
};
const getRoutesService = () => {
  return require('../routes/routes.service.js').RoutesService;
};

interface PickupGroup {
  pickupLocation: { lat: number; lng: number; address?: string };
  orders: OrderEntity[];
}

@Injectable()
export class SmartPathService {
  private readonly PICKUP_TOLERANCE_METERS = 100;

  constructor(
    @InjectRepository(SmartPathEntity)
    private readonly smartPathRepository: Repository<SmartPathEntity>,
    private readonly driversService: DriversService,
    @Inject(forwardRef(() => getOrdersService()))
    private readonly ordersService: OrdersService,
    @Inject(forwardRef(() => getRoutesService()))
    private readonly routesService: RoutesService
  ) {}

  /**
   * Generate Smart Path for a driver
   * Identifies today's subscription orders and accepted orders, groups by pickup location, and creates optimized routes
   */
  async generateSmartPath(driverId: string, date?: Date): Promise<SmartPathEntity[]> {
    console.log(`[SmartPath] Generating Smart Path for driver ${driverId}, date: ${date || 'today'}`);
    
    const targetDate = date || new Date();
    // Normalize targetDate to start of day for date column
    const normalizedTargetDate = new Date(targetDate);
    normalizedTargetDate.setHours(0, 0, 0, 0);
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 1, 0, 0); // 12:01 AM
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999); // 11:59:59 PM

    console.log(`[SmartPath] Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    // Get driver to access current location
    const driver = await this.driversService.findById(driverId);
    console.log(`[SmartPath] Driver found: ${driver.id}, location: ${driver.latitude}, ${driver.longitude}`);

    if (!driver.latitude || !driver.longitude) {
      console.warn(`[SmartPath] Driver ${driverId} has no location set. Routes will start from pickup location.`);
    }

    // Query today's subscription orders and accepted orders for this driver
    const ordersForSmartPath = await this.getTodaysOrdersForSmartPath(driverId, startOfDay, endOfDay);
    console.log(`[SmartPath] Found ${ordersForSmartPath.length} orders for smart path (subscription + accepted)`);

    if (ordersForSmartPath.length === 0) {
      console.log(`[SmartPath] No orders found for smart path generation. Returning empty array.`);
      return []; // No orders for today
    }

    // Log order details for debugging
    ordersForSmartPath.forEach((order, idx) => {
      console.log(`[SmartPath] Order ${idx + 1}: id=${order.id}, type=${order.orderType}, status=${order.status}, createdAt=${order.createdAt}`);
      console.log(`[SmartPath]   Pickup: ${JSON.stringify(order.pickup)}, Dropoff: ${JSON.stringify(order.dropoff)}`);
    });

    // Group orders by pickup location (within 100m tolerance)
    const pickupGroups = this.groupOrdersByPickupLocation(ordersForSmartPath, this.PICKUP_TOLERANCE_METERS);
    console.log(`[SmartPath] Grouped into ${pickupGroups.length} pickup location groups`);

    // Generate Smart Path for each pickup group
    const smartPaths: SmartPathEntity[] = [];

    for (const group of pickupGroups) {
      console.log(`[SmartPath] Processing group with ${group.orders.length} orders at pickup: ${group.pickupLocation.lat}, ${group.pickupLocation.lng}`);
      
      // Create optimized route for this group
      const routePlan = await this.createOptimizedRoute(driver, group);
      console.log(`[SmartPath] Route plan created: ${routePlan ? `id=${routePlan.id}, stops=${routePlan.stops?.length || 0}` : 'null'}`);

      // Create Smart Path entity
      const smartPath = this.smartPathRepository.create({
        driverId: driverId,
        pickupLocation: group.pickupLocation,
        orderIds: group.orders.map(o => o.id),
        routePlanId: routePlan?.id || null,
        status: 'planned',
        targetDate: normalizedTargetDate
      });

      const savedSmartPath = await this.smartPathRepository.save(smartPath);
      console.log(`[SmartPath] Saved Smart Path: id=${savedSmartPath.id}, orderIds=${savedSmartPath.orderIds.length}`);
      smartPaths.push(savedSmartPath);
    }

    console.log(`[SmartPath] Generated ${smartPaths.length} Smart Path(s) total`);
    return smartPaths;
  }

  /**
   * Get Smart Path for a driver (today's)
   */
  async getSmartPathForDriver(driverId: string, date?: Date): Promise<SmartPathEntity[]> {
    const targetDate = date || new Date();
    // Normalize to start of day for date comparison
    const normalizedDate = new Date(targetDate);
    normalizedDate.setHours(0, 0, 0, 0);

    // Use date string comparison for PostgreSQL date type
    const dateString = normalizedDate.toISOString().split('T')[0];
    
    return await this.smartPathRepository
      .createQueryBuilder('smartPath')
      .leftJoinAndSelect('smartPath.routePlan', 'routePlan')
      .where('smartPath.driverId = :driverId', { driverId })
      .andWhere('smartPath.targetDate = :targetDate', { targetDate: dateString })
      .orderBy('smartPath.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Get specific Smart Path by ID
   */
  async getSmartPathById(id: string): Promise<SmartPathEntity> {
    const smartPath = await this.smartPathRepository.findOne({
      where: { id },
      relations: ['routePlan']
    });

    if (!smartPath) {
      throw new NotFoundException(`Smart Path ${id} not found`);
    }

    return smartPath;
  }

  /**
   * Query today's subscription orders and accepted orders for a driver
   * Returns orders that are either:
   * 1. Subscription orders created today, OR
   * 2. Accepted orders (regardless of order type or creation date)
   */
  private async getTodaysOrdersForSmartPath(
    driverId: string,
    startOfDay: Date,
    endOfDay: Date
  ): Promise<OrderEntity[]> {
    console.log(`[SmartPath] Getting orders for smart path generation for driver ${driverId}`);
    
    // Use raw orders method to get OrderEntity
    const activeOrders = await (this.ordersService as OrdersService & {
      getActiveOrdersByDriverRaw: (driverId: string) => Promise<OrderEntity[]>;
    }).getActiveOrdersByDriverRaw(driverId);

    console.log(`[SmartPath] Found ${activeOrders.length} total active orders for driver`);

    // Filter for:
    // 1. Subscription orders created today, OR
    // 2. Accepted orders (any type, any date)
    const excludedStatuses = ['delivered', 'cancelled', 'cancelled', 'failed', 'refunded', 'refund_requested', 'refund_request_cancelled'];
    
    const filtered = activeOrders.filter(order => {
      const isAccepted = order.status.toLowerCase() === 'accepted';
      const isSubscription = order.orderType === 'subscription';
      const isToday = order.createdAt >= startOfDay && order.createdAt <= endOfDay;
      const isActive = !excludedStatuses.includes(order.status.toLowerCase());
      
      // Include if: (subscription AND today AND active) OR (accepted status)
      const shouldInclude = (isSubscription && isToday && isActive) || isAccepted;
      
      if (!shouldInclude) {
        if (!isSubscription && !isAccepted) {
          console.log(`[SmartPath] Order ${order.id} filtered out: not subscription and not accepted (type=${order.orderType}, status=${order.status})`);
        } else if (isSubscription && !isToday) {
          console.log(`[SmartPath] Order ${order.id} filtered out: subscription but not today (createdAt=${order.createdAt}, range=${startOfDay.toISOString()} to ${endOfDay.toISOString()})`);
        } else if (isSubscription && !isActive) {
          console.log(`[SmartPath] Order ${order.id} filtered out: subscription but not active (status=${order.status})`);
        }
      }
      
      return shouldInclude;
    });

    const subscriptionCount = filtered.filter(o => o.orderType === 'subscription').length;
    const acceptedCount = filtered.filter(o => o.status.toLowerCase() === 'accepted').length;
    console.log(`[SmartPath] Filtered to ${filtered.length} orders for smart path (${subscriptionCount} subscription, ${acceptedCount} accepted)`);
    return filtered;
  }

  /**
   * Group orders by pickup location within tolerance
   */
  private groupOrdersByPickupLocation(
    orders: OrderEntity[],
    toleranceMeters: number
  ): PickupGroup[] {
    const groups: PickupGroup[] = [];

    for (const order of orders) {
      if (!order.pickup || typeof order.pickup !== 'object' || !('lat' in order.pickup) || !('lng' in order.pickup)) {
        continue; // Skip orders without valid pickup location
      }

      const pickup = {
        lat: (order.pickup as any).lat,
        lng: (order.pickup as any).lng,
        address: (order.pickup as any).address
      };

      // Find existing group with nearby pickup location
      let foundGroup = false;
      for (const group of groups) {
        if (areLocationsNearby(group.pickupLocation, pickup, toleranceMeters)) {
          group.orders.push(order);
          foundGroup = true;
          break;
        }
      }

      // Create new group if no nearby pickup found
      if (!foundGroup) {
        groups.push({
          pickupLocation: pickup,
          orders: [order]
        });
      }
    }

    return groups;
  }

  /**
   * Create optimized route for a pickup group
   * Route: Driver location → Pickup → Nearest dropoffs
   */
  private async createOptimizedRoute(
    driver: { id: string; latitude: number | null; longitude: number | null },
    group: PickupGroup
  ): Promise<any> {
    console.log(`[SmartPath] Creating optimized route for driver ${driver.id}`);
    const stops: Array<{ lat: number; lng: number; orderId?: string }> = [];

    // Start from driver's current location
    if (driver.latitude && driver.longitude) {
      stops.push({
        lat: driver.latitude,
        lng: driver.longitude
      });
      console.log(`[SmartPath] Added driver location as first stop: ${driver.latitude}, ${driver.longitude}`);
    } else {
      console.warn(`[SmartPath] Driver has no location, starting route from pickup location`);
    }

    // Add pickup location
    stops.push({
      lat: group.pickupLocation.lat,
      lng: group.pickupLocation.lng
    });
    console.log(`[SmartPath] Added pickup location: ${group.pickupLocation.lat}, ${group.pickupLocation.lng}`);

    // Add dropoff locations, sorted by nearest-neighbor from pickup
    const dropoffs = group.orders
      .map(order => {
        if (!order.dropoff || typeof order.dropoff !== 'object' || !('lat' in order.dropoff) || !('lng' in order.dropoff)) {
          console.warn(`[SmartPath] Order ${order.id} has no valid dropoff location`);
          return null;
        }
        return {
          lat: (order.dropoff as any).lat,
          lng: (order.dropoff as any).lng,
          orderId: order.id
        };
      })
      .filter((d): d is { lat: number; lng: number; orderId: string } => d !== null);

    console.log(`[SmartPath] Found ${dropoffs.length} valid dropoff locations`);

    // Sort dropoffs by distance from pickup (nearest first)
    const sortedDropoffs = this.sortByNearestNeighbor(
      group.pickupLocation,
      dropoffs
    );

    stops.push(...sortedDropoffs);
    console.log(`[SmartPath] Total stops for route: ${stops.length} (driver=${driver.latitude ? 1 : 0}, pickup=1, dropoffs=${sortedDropoffs.length})`);

    // Use RoutesService to optimize the route
    try {
      console.log(`[SmartPath] Calling RoutesService.optimizeForDriver with ${stops.length} stops`);
      const routePlan = await (this.routesService as RoutesService & {
        optimizeForDriver: (driverId: string, stops?: Array<{ lat: number; lng: number; orderId?: string }>) => Promise<any>;
      }).optimizeForDriver(driver.id, stops);

      if (routePlan) {
        console.log(`[SmartPath] Route optimized successfully: id=${routePlan.id}, stops=${routePlan.stops?.length || 0}`);
      } else {
        console.warn(`[SmartPath] Route optimization returned null`);
      }

      return routePlan;
    } catch (error) {
      console.error(`[SmartPath] Failed to optimize route:`, error);
      if (error instanceof Error) {
        console.error(`[SmartPath] Error message: ${error.message}`);
        console.error(`[SmartPath] Error stack: ${error.stack}`);
      }
      return null;
    }
  }

  /**
   * Sort locations by nearest-neighbor algorithm from a starting point
   */
  private sortByNearestNeighbor(
    start: { lat: number; lng: number },
    locations: Array<{ lat: number; lng: number; orderId?: string }>
  ): Array<{ lat: number; lng: number; orderId?: string }> {
    if (locations.length <= 1) {
      return locations;
    }

    const sorted: Array<{ lat: number; lng: number; orderId?: string }> = [];
    const remaining = [...locations];
    let current = start;

    while (remaining.length > 0) {
      // Find nearest location to current
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(
        current.lat,
        current.lng,
        remaining[0].lat,
        remaining[0].lng
      );

      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateDistance(
          current.lat,
          current.lng,
          remaining[i].lat,
          remaining[i].lng
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      // Move nearest to sorted and update current
      const nearest = remaining.splice(nearestIndex, 1)[0];
      sorted.push(nearest);
      current = nearest;
    }

    return sorted;
  }

  /**
   * Calculate distance between two points using Haversine formula (in meters)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return haversineDistanceMeters(lat1, lng1, lat2, lng2);
  }
}
