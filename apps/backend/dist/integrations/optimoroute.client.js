var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OptimoRouteClient_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
let OptimoRouteClient = OptimoRouteClient_1 = class OptimoRouteClient {
    configService;
    logger = new Logger(OptimoRouteClient_1.name);
    baseUrl;
    apiKey;
    constructor(configService) {
        this.configService = configService;
        this.baseUrl = this.configService.get('optimoRoute.baseUrl', { infer: true });
        this.apiKey = this.configService.get('optimoRoute.apiKey', { infer: true });
    }
    async optimizeRoute(payload) {
        if (!this.apiKey || this.apiKey === 'your_optimoroute_key_here') {
            this.logger.warn('OptimoRoute API key not configured, using mock response');
            return this.getMockResponse(payload);
        }
        const url = `${this.baseUrl}/optimize`;
        try {
            const response = await axios.post(url, payload, { headers: { 'X-API-Key': this.apiKey } });
            return response.data;
        }
        catch (error) {
            this.logger.error(`OptimoRoute optimize failed for driver ${payload.driverId}, falling back to mock`, error);
            return this.getMockResponse(payload);
        }
    }
    getMockResponse(payload) {
        const { stops } = payload;
        let totalDistance = 0;
        for (let i = 0; i < stops.length - 1; i++) {
            const lat1 = stops[i].lat;
            const lng1 = stops[i].lng;
            const lat2 = stops[i + 1].lat;
            const lng2 = stops[i + 1].lng;
            const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)) * 111;
            totalDistance += distance;
        }
        const sequence = stops.map((_, index) => index);
        const etaPerStop = stops.map((_, index) => {
            const distanceToStop = totalDistance * (index + 1) / stops.length;
            const travelTime = (distanceToStop / 30) * 60;
            const stopTime = (index + 1) * 5;
            return Math.round(travelTime + stopTime) * 60;
        });
        const polyline = stops.map(s => `${s.lat},${s.lng}`).join(';');
        return {
            success: true,
            sequence,
            polyline,
            etaPerStop,
            distanceKm: parseFloat(totalDistance.toFixed(2)),
            estimatedDuration: etaPerStop[etaPerStop.length - 1],
            mock: true,
            algorithm: 'simple-mock',
        };
    }
};
OptimoRouteClient = OptimoRouteClient_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], OptimoRouteClient);
export { OptimoRouteClient };
