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
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriversService } from '../drivers/drivers.service.js';
import { RoutePlanEntity } from './entities/route-plan.entity.js';
import { OptimoRouteClient } from '../../integrations/optimoroute.client.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const getOrdersService = () => {
    return require('../orders/orders.service.js').OrdersService;
};
let RoutesService = class RoutesService {
    routePlansRepository;
    driversService;
    optimoRouteClient;
    ordersService;
    constructor(routePlansRepository, driversService, optimoRouteClient, ordersService) {
        this.routePlansRepository = routePlansRepository;
        this.driversService = driversService;
        this.optimoRouteClient = optimoRouteClient;
        this.ordersService = ordersService;
    }
    async enqueueOptimizationForDriver(driverId) {
        return this.optimizeForDriver(driverId);
    }
    async optimizeForDriver(driverId, stopsOverride) {
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
    async getLatestPlanForDriver(driverId) {
        return this.routePlansRepository.findOne({ where: { driverId }, order: { createdAt: 'DESC' } });
    }
};
RoutesService = __decorate([
    Injectable(),
    __param(0, InjectRepository(RoutePlanEntity)),
    __param(3, Inject(forwardRef(() => getOrdersService()))),
    __metadata("design:paramtypes", [Repository,
        DriversService,
        OptimoRouteClient, Function])
], RoutesService);
export { RoutesService };
