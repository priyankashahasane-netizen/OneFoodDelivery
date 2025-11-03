import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class IpstackClient {
  private readonly logger = new Logger(IpstackClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('ipstack.baseUrl', { infer: true })!;
    this.apiKey = this.configService.get<string>('ipstack.apiKey', { infer: true })!;
  }

  async lookup(ip: string) {
    // Use mock response if API key is not configured (for testing)
    if (!this.apiKey || this.apiKey === 'your_ipstack_key_here') {
      this.logger.warn('ipstack API key not configured, using mock response');
      return this.getMockResponse(ip);
    }

    try {
      const url = `${this.baseUrl}/${ip}?access_key=${this.apiKey}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      this.logger.warn(`ipstack lookup failed for ${ip}, falling back to mock`, error as Error);
      // Fallback to mock response on error
      return this.getMockResponse(ip);
    }
  }

  /**
   * Generate mock IP geolocation response for testing
   */
  private getMockResponse(ip: string) {
    // Default to Bangalore, India for mock
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
}


