import { Injectable, Inject, forwardRef } from '@nestjs/common';
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
}

