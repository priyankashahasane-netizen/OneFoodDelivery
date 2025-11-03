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
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OptimizeRouteDto } from './dto/optimize-route.dto.js';
import { RoutesService } from './routes.service.js';
let RoutesController = class RoutesController {
    routesService;
    constructor(routesService) {
        this.routesService = routesService;
    }
    async optimize(payload) {
        return this.routesService.optimizeForDriver(payload.driverId, payload.stops.map((s) => ({ lat: s.lat, lng: s.lng, orderId: s.orderId })));
    }
    async latest(driverId) {
        return this.routesService.getLatestPlanForDriver(driverId);
    }
};
__decorate([
    Post('optimize'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [OptimizeRouteDto]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "optimize", null);
__decorate([
    Get('driver/:driverId/latest'),
    __param(0, Param('driverId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "latest", null);
RoutesController = __decorate([
    Controller('routes'),
    __metadata("design:paramtypes", [RoutesService])
], RoutesController);
export { RoutesController };
