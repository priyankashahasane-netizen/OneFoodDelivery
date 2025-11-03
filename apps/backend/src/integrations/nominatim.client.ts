import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InjectRedis } from '../common/redis/redis.provider.js';

@Injectable()
export class NominatimClient {
  private readonly logger = new Logger(NominatimClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService, @InjectRedis() private readonly redis) {
    this.baseUrl = this.configService.get<string>('osm.nominatimUrl', { infer: true })!;
  }

  async reverseGeocode(lat: number, lon: number) {
    try {
      const rlat = Math.round(lat * 1e5) / 1e5;
      const rlon = Math.round(lon * 1e5) / 1e5;
      const cacheKey = `geo:rev:${rlat}:${rlon}`;
      
      // Try to get from cache, but continue if Redis is unavailable
      try {
        if (this.isRedisAvailable()) {
          const cached = await this.redis.get(cacheKey);
          if (cached) return JSON.parse(cached);
        }
      } catch (cacheError) {
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
      
      // Try to cache the result, but don't fail if Redis is unavailable
      try {
        if (this.isRedisAvailable()) {
          await this.redis.set(cacheKey, JSON.stringify(response.data), 'EX', 60 * 60 * 24 * 7);
        }
      } catch (cacheError) {
        this.logger.debug('Redis cache write failed, continuing without cache:', cacheError);
      }
      
      return response.data;
    } catch (error) {
      this.logger.warn(`Nominatim reverse geocode failed for ${lat},${lon}`, error as Error);
      throw error;
    }
  }

  private isRedisAvailable(): boolean {
    return this.redis && (this.redis.status === 'ready' || this.redis.status === 'connecting');
  }
}

