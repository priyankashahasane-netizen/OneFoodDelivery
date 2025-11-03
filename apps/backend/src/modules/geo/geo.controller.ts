import { Controller, Get, Headers, Query } from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';

import { IpstackClient } from '../../integrations/ipstack.client.js';
import { NominatimClient } from '../../integrations/nominatim.client.js';

@Controller('geo')
export class GeoController {
  constructor(private readonly ipstack: IpstackClient, private readonly nominatim: NominatimClient) {}

  // PRD: GET /api/geo/ip
  @Public()
  @Get('ip')
  async ip(@Headers('x-forwarded-for') forwarded?: string) {
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

  // PRD: GET /api/geo/reverse?lat=&lng=
  @Public()
  @Get('reverse')
  async reverse(@Query('lat') lat: number, @Query('lng') lng: number) {
    const res = await this.nominatim.reverseGeocode(lat, lng);
    return {
      address: res?.display_name
    };
  }
}

