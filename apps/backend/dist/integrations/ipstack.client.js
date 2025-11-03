var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IpstackClient_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
let IpstackClient = IpstackClient_1 = class IpstackClient {
    configService;
    logger = new Logger(IpstackClient_1.name);
    baseUrl;
    apiKey;
    constructor(configService) {
        this.configService = configService;
        this.baseUrl = this.configService.get('ipstack.baseUrl', { infer: true });
        this.apiKey = this.configService.get('ipstack.apiKey', { infer: true });
    }
    async lookup(ip) {
        if (!this.apiKey || this.apiKey === 'your_ipstack_key_here') {
            this.logger.warn('ipstack API key not configured, using mock response');
            return this.getMockResponse(ip);
        }
        try {
            const url = `${this.baseUrl}/${ip}?access_key=${this.apiKey}`;
            const response = await axios.get(url);
            return response.data;
        }
        catch (error) {
            this.logger.warn(`ipstack lookup failed for ${ip}, falling back to mock`, error);
            return this.getMockResponse(ip);
        }
    }
    getMockResponse(ip) {
        return {
            ip,
            type: 'ipv4',
            continent_code: 'AS',
            continent_name: 'Asia',
            country_code: 'IN',
            country_name: 'India',
            region_code: 'KA',
            region_name: 'Karnataka',
            city: 'Bengaluru',
            zip: '560001',
            latitude: 12.9716,
            longitude: 77.5946,
            location: {
                geoname_id: 1277333,
                capital: 'New Delhi',
                languages: [
                    {
                        code: 'hi',
                        name: 'Hindi',
                        native: 'हिन्दी'
                    },
                    {
                        code: 'en',
                        name: 'English',
                        native: 'English'
                    }
                ],
                country_flag: 'https://assets.ipstack.com/flags/in.svg',
                country_flag_emoji: '🇮🇳',
                country_flag_emoji_unicode: 'U+1F1EE U+1F1F3',
                calling_code: '91',
                is_eu: false
            },
            time_zone: {
                id: 'Asia/Kolkata',
                current_time: new Date().toISOString(),
                gmt_offset: 19800,
                code: 'IST',
                is_daylight_saving: false
            },
            currency: {
                code: 'INR',
                name: 'Indian Rupee',
                plural: 'Indian rupees',
                symbol: '₹',
                symbol_native: '₹'
            },
            connection: {
                asn: 0,
                isp: 'Mock ISP'
            },
            mock: true
        };
    }
};
IpstackClient = IpstackClient_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], IpstackClient);
export { IpstackClient };
