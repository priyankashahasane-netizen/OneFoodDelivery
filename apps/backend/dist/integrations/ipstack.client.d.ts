import { ConfigService } from '@nestjs/config';
export declare class IpstackClient {
    private readonly configService;
    private readonly logger;
    private readonly baseUrl;
    private readonly apiKey;
    constructor(configService: ConfigService);
    lookup(ip: string): Promise<any>;
    private getMockResponse;
}
