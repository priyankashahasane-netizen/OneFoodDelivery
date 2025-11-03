import { Test, TestingModule } from '@nestjs/testing';
import { GeoController } from './geo.controller.js';
import { IpstackClient } from '../../integrations/ipstack.client.js';
import { NominatimClient } from '../../integrations/nominatim.client.js';

/**
 * Geo Controller Tests
 * PRD Reference: 5) API Contracts - "GET /api/geo/ip" (ipstack), "GET /api/geo/reverse" (Nominatim)
 * PRD Reference: 2.2 Customer Tracking - "On first load, ipstack lookup of client IP → personalize language/units/timezone"
 * PRD Reference: Key Integrations - "ipstack (IP → geo, timezone, and locale inference)"
 */
describe('GeoController', () => {
  let controller: GeoController;
  let ipstackClient: IpstackClient;
  let nominatimClient: NominatimClient;

  const mockIpstackClient = {
    lookup: jest.fn(),
  };

  const mockNominatimClient = {
    reverseGeocode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeoController],
      providers: [
        {
          provide: IpstackClient,
          useValue: mockIpstackClient,
        },
        {
          provide: NominatimClient,
          useValue: mockNominatimClient,
        },
      ],
    }).compile();

    controller = module.get<GeoController>(GeoController);
    ipstackClient = module.get<IpstackClient>(IpstackClient);
    nominatimClient = module.get<NominatimClient>(NominatimClient);

    jest.clearAllMocks();
  });

  describe('GET /geo/ip', () => {
    it('should lookup IP and return geo information for personalization', async () => {
      // Arrange
      const clientIp = '103.14.123.45';
      const mockIpstackResponse = {
        city: 'Bengaluru',
        country_code: 'IN',
        time_zone: {
          id: 'Asia/Kolkata',
        },
        location: {
          languages: [{ code: 'en' }],
        },
      };

      mockIpstackClient.lookup.mockResolvedValue(mockIpstackResponse);

      // Act
      const result = await controller.ip(clientIp);

      // Assert
      expect(result.city).toBe('Bengaluru');
      expect(result.country_code).toBe('IN');
      expect(result.tz).toBe('Asia/Kolkata');
      expect(result.lang).toContain('en');
      expect(result.approx).toBe(true);
      expect(mockIpstackClient.lookup).toHaveBeenCalledWith(clientIp);
    });

    it('should extract IP from X-Forwarded-For header', async () => {
      // Arrange
      const forwardedFor = '203.0.113.45, 192.0.2.1';
      const mockIpstackResponse = {
        city: 'Mumbai',
        country_code: 'IN',
        time_zone: { id: 'Asia/Kolkata' },
        location: { languages: [{ code: 'hi' }] },
      };

      mockIpstackClient.lookup.mockResolvedValue(mockIpstackResponse);

      // Act
      const result = await controller.ip(forwardedFor);

      // Assert - Should use first IP in X-Forwarded-For
      expect(mockIpstackClient.lookup).toHaveBeenCalledWith('203.0.113.45');
      expect(result.city).toBe('Mumbai');
    });

    it('should use "check" as default IP if not provided', async () => {
      // Arrange
      const mockIpstackResponse = {
        city: 'Unknown',
        country_code: 'US',
        time_zone: { id: 'America/New_York' },
        location: { languages: [{ code: 'en' }] },
      };

      mockIpstackClient.lookup.mockResolvedValue(mockIpstackResponse);

      // Act
      const result = await controller.ip('');

      // Assert
      expect(mockIpstackClient.lookup).toHaveBeenCalledWith('check');
      expect(result).toBeDefined();
    });

    it('should handle timezone fallback when time_zone is string', async () => {
      // Arrange
      const mockIpstackResponse = {
        city: 'Bengaluru',
        country_code: 'IN',
        time_zone: 'Asia/Kolkata', // String format
        location: { languages: [{ code: 'en' }] },
      };

      mockIpstackClient.lookup.mockResolvedValue(mockIpstackResponse);

      // Act
      const result = await controller.ip('103.14.123.45');

      // Assert
      expect(result.tz).toBe('Asia/Kolkata');
    });

    it('should construct language code from location.languages', async () => {
      // Arrange
      const mockIpstackResponse = {
        city: 'Bengaluru',
        country_code: 'IN',
        time_zone: { id: 'Asia/Kolkata' },
        location: {
          languages: [{ code: 'en' }],
        },
      };

      mockIpstackClient.lookup.mockResolvedValue(mockIpstackResponse);

      // Act
      const result = await controller.ip('103.14.123.45');

      // Assert
      expect(result.lang).toBe('en-IN');
    });
  });

  describe('GET /geo/reverse', () => {
    it('should reverse geocode coordinates to address using Nominatim', async () => {
      // Arrange
      const lat = 12.9716;
      const lng = 77.5946;
      const mockNominatimResponse = {
        display_name: 'MG Road, Bengaluru, Karnataka, India',
        address: {
          road: 'MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
        },
      };

      mockNominatimClient.reverseGeocode.mockResolvedValue(mockNominatimResponse);

      // Act
      const result = await controller.reverse(lat, lng);

      // Assert
      expect(result.address).toBe('MG Road, Bengaluru, Karnataka, India');
      expect(mockNominatimClient.reverseGeocode).toHaveBeenCalledWith(lat, lng);
    });

    it('should handle reverse geocoding for delivery pickup location', async () => {
      // Arrange
      const lat = 12.9352;
      const lng = 77.6245;
      const mockNominatimResponse = {
        display_name: 'Koramangala, Bengaluru, Karnataka, India',
      };

      mockNominatimClient.reverseGeocode.mockResolvedValue(mockNominatimResponse);

      // Act
      const result = await controller.reverse(lat, lng);

      // Assert
      expect(result.address).toBe('Koramangala, Bengaluru, Karnataka, India');
    });

    it('should handle Nominatim API errors gracefully', async () => {
      // Arrange
      const lat = 12.9716;
      const lng = 77.5946;

      mockNominatimClient.reverseGeocode.mockRejectedValue(
        new Error('Nominatim API error')
      );

      // Act & Assert
      await expect(controller.reverse(lat, lng)).rejects.toThrow('Nominatim API error');
    });
  });
});


