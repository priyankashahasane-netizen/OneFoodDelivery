import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DriversService } from '../drivers/drivers.service.js';
import type { OrdersService } from '../orders/orders.service.js';
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
    const driver = await this.driversService.findById(driverId);

    let stops = stopsOverride ?? [];
    if (!stops.length) {
      const active = await this.ordersService.getActiveOrdersByDriver(driverId);
      stops = active.flatMap((o) => [{ lat: o.pickup.lat, lng: o.pickup.lng, orderId: o.id }, { lat: o.dropoff.lat, lng: o.dropoff.lng, orderId: o.id }]);
    }
    if (!stops.length) {
      const defaultStops = driver.latitude && driver.longitude ? [{ lat: driver.latitude, lng: driver.longitude }] : [];
      stops = defaultStops;
    }
    const response = await this.optimoRouteClient.optimizeRoute({ driverId, stops });

    const plan = this.routePlansRepository.create({
      driverId,
      stops: response?.stops ?? stops,
      totalDistanceKm: response?.distanceKm ?? 0,
      etaPerStop: response?.etaPerStop ?? null,
      rawResponse: response ?? null,
      provider: 'optimoroute'
    });
    return this.routePlansRepository.save(plan);
  }

  async getLatestPlanForDriver(driverId: string) {
    return this.routePlansRepository.findOne({ where: { driverId }, order: { createdAt: 'DESC' } });
  }
}

