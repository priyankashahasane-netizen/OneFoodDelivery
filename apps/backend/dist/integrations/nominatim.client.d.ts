import { ConfigService } from '@nestjs/config';
export declare class NominatimClient {
    private readonly configService;
    private readonly redis;
    private readonly logger;
    private readonly baseUrl;
    constructor(configService: ConfigService, redis: any);
    reverseGeocode(lat: number, lon: number): Promise<any>;
    private isRedisAvailable;
}
