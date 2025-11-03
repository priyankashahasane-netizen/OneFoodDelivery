import { Module } from '@nestjs/common';

import { RedisClientProvider } from '../../common/redis/redis.provider.js';
import { IpstackClient } from '../../integrations/ipstack.client.js';
import { NominatimClient } from '../../integrations/nominatim.client.js';
import { GeoController } from './geo.controller.js';

@Module({
  controllers: [GeoController],
  providers: [IpstackClient, NominatimClient, RedisClientProvider]
})
export class GeoModule {}


