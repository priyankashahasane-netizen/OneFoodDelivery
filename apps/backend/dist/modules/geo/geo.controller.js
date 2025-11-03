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
import { Controller, Get, Headers, Query } from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';
import { IpstackClient } from '../../integrations/ipstack.client.js';
import { NominatimClient } from '../../integrations/nominatim.client.js';
let GeoController = class GeoController {
    ipstack;
    nominatim;
    constructor(ipstack, nominatim) {
        this.ipstack = ipstack;
        this.nominatim = nominatim;
    }
    async ip(forwarded) {
        const ip = (forwarded ?? '').split(',')[0].trim();
        const data = await this.ipstack.lookup(ip || 'check');
        return {
            city: data.city,
            country_code: data.country_code,
            tz: data.time_zone?.id ?? data.time_zone,
            lang: `${data.location?.languages?.[0]?.code ?? 'en'}-${data.country_code ?? 'US'}`,
            approx: true
        };
    }
    async reverse(lat, lng) {
        const res = await this.nominatim.reverseGeocode(lat, lng);
        return {
            address: res?.display_name
        };
    }
};
__decorate([
    Public(),
    Get('ip'),
    __param(0, Headers('x-forwarded-for')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GeoController.prototype, "ip", null);
__decorate([
    Public(),
    Get('reverse'),
    __param(0, Query('lat')),
    __param(1, Query('lng')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], GeoController.prototype, "reverse", null);
GeoController = __decorate([
    Controller('geo'),
    __metadata("design:paramtypes", [IpstackClient, NominatimClient])
], GeoController);
export { GeoController };
