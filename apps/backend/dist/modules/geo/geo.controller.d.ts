import { IpstackClient } from '../../integrations/ipstack.client.js';
import { NominatimClient } from '../../integrations/nominatim.client.js';
export declare class GeoController {
    private readonly ipstack;
    private readonly nominatim;
    constructor(ipstack: IpstackClient, nominatim: NominatimClient);
    ip(forwarded?: string): Promise<{
        city: any;
        country_code: any;
        tz: any;
        lang: string;
        approx: boolean;
    }>;
    reverse(lat: number, lng: number): Promise<{
        address: any;
    }>;
}
