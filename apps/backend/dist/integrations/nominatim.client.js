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
var NominatimClient_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InjectRedis } from '../common/redis/redis.provider.js';
let NominatimClient = NominatimClient_1 = class NominatimClient {
    configService;
    redis;
    logger = new Logger(NominatimClient_1.name);
    baseUrl;
    constructor(configService, redis) {
        this.configService = configService;
        this.redis = redis;
        this.baseUrl = this.configService.get('osm.nominatimUrl', { infer: true });
    }
    async reverseGeocode(lat, lon) {
        try {
            const rlat = Math.round(lat * 1e5) / 1e5;
            const rlon = Math.round(lon * 1e5) / 1e5;
            const cacheKey = `geo:rev:${rlat}:${rlon}`;
            try {
                if (this.isRedisAvailable()) {
                    const cached = await this.redis.get(cacheKey);
                    if (cached)
                        return JSON.parse(cached);
                }
            }
            catch (cacheError) {
                this.logger.debug('Redis cache read failed, fetching from API:', cacheError);
            }
            const response = await axios.get(`${this.baseUrl}/reverse`, {
                params: {
                    format: 'json',
                    lat: rlat,
                    lon: rlon,
                    addressdetails: 1
                }
            });
            try {
                if (this.isRedisAvailable()) {
                    await this.redis.set(cacheKey, JSON.stringify(response.data), 'EX', 60 * 60 * 24 * 7);
                }
            }
            catch (cacheError) {
                this.logger.debug('Redis cache write failed, continuing without cache:', cacheError);
            }
            return response.data;
        }
        catch (error) {
            this.logger.warn(`Nominatim reverse geocode failed for ${lat},${lon}`, error);
            throw error;
        }
    }
    isRedisAvailable() {
        return this.redis && (this.redis.status === 'ready' || this.redis.status === 'connecting');
    }
};
NominatimClient = NominatimClient_1 = __decorate([
    Injectable(),
    __param(1, InjectRedis()),
    __metadata("design:paramtypes", [ConfigService, Object])
], NominatimClient);
export { NominatimClient };
