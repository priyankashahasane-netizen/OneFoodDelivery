import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NominatimClient } from './nominatim.client.js';
import axios from 'axios';
import { REDIS_CLIENT } from '../common/redis/redis.provider.js';

/**
 * Nominatim Client Tests
 * Verifies that the backend uses OpenStreetMap Nominatim API
 * PRD Reference: Key Integrations - "OpenStreetMap (https://www.openstreetmap.org/) — map baselayer & geocoding"
 * PRD Reference: "Geocoding: Nominatim (or hosted provider) for reverse geocoding driver coordinates"
 */
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NominatimClient - OpenStreetMap Verification', () => {
  let client: NominatimClient;
  let configService: ConfigService;
  let redisMock: any;

  beforeEach(async () => {
    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NominatimClient,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'osm.nominatimUrl') {
                return 'https://nominatim.openstreetmap.org';
              }
              return undefined;
            }),
          },
        },
        {
          provide: REDIS_CLIENT,
          useValue: redisMock,
        },
      ],
    }).compile();

    client = module.get<NominatimClient>(NominatimClient);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  describe('OpenStreetMap Integration Verification', () => {
    it('should use OpenStreetMap Nominatim API URL from configuration', () => {
      // Arrange
      const nominatimUrl = configService.get<string>('osm.nominatimUrl');

      // Assert
      expect(nominatimUrl).toBe('https://nominatim.openstreetmap.org');
      expect(nominatimUrl).toContain('nominatim.openstreetmap.org');
      expect(nominatimUrl).toMatch(/^https:\/\//);
    });

    it('should construct reverse geocoding request to OpenStreetMap Nominatim', async () => {
      // Arrange
      const lat = 12.9716;
      const lng = 77.5946;
      const mockResponse = {
        data: {
          display_name: 'MG Road, Bengaluru, Karnataka, India',
          address: {
            road: 'MG Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            country: 'India',
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse as any);
      redisMock.get.mockResolvedValue(null);

      // Act
      await client.reverseGeocode(lat, lng);

      // Assert - Verify request to OpenStreetMap Nominatim
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/reverse',
        expect.objectContaining({
          params: expect.objectContaining({
            format: 'json',
            lat: expect.any(Number),
            lon: expect.any(Number),
            addressdetails: 1,
          }),
        })
      );

      // Verify URL contains OpenStreetMap domain
      const callArgs = mockedAxios.get.mock.calls[0];
      const url = callArgs[0] as string;
      expect(url).toContain('nominatim.openstreetmap.org');
      expect(url).toMatch(/^https:\/\//);
    });

    it('should not use Google Maps Geocoding API', async () => {
      // Arrange
      const lat = 12.9716;
      const lng = 77.5946;
      const mockResponse = {
        data: {
          display_name: 'MG Road, Bengaluru, Karnataka, India',
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse as any);
      redisMock.get.mockResolvedValue(null);

      // Act
      await client.reverseGeocode(lat, lng);

      // Assert - Should not call Google Maps
      const callArgs = mockedAxios.get.mock.calls[0];
      const url = callArgs[0] as string;
      expect(url).not.toContain('maps.googleapis.com');
      expect(url).not.toContain('google.com');
      expect(url).toContain('openstreetmap.org');
    });

    it('should use OpenStreetMap Nominatim base URL from configuration', () => {
      // Act
      const baseUrl = (client as any).baseUrl;

      // Assert
      expect(baseUrl).toBe('https://nominatim.openstreetmap.org');
      expect(baseUrl).toMatch(/^https:\/\/nominatim\.openstreetmap\.org$/);
    });
  });

  describe('OpenStreetMap API Compliance', () => {
    it('should round coordinates to reduce unnecessary API calls', async () => {
      // Arrange
      const lat = 12.9716123456;
      const lng = 77.5946789012;
      const mockResponse = {
        data: {
          display_name: 'Test Address',
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse as any);
      redisMock.get.mockResolvedValue(null);

      // Act
      await client.reverseGeocode(lat, lng);

      // Assert - Coordinates should be rounded
      const callArgs = mockedAxios.get.mock.calls[0];
      const params = callArgs[1].params;
      expect(params.lat).toBe(Math.round(lat * 1e5) / 1e5);
      expect(params.lon).toBe(Math.round(lng * 1e5) / 1e5);
    });

    it('should cache results to respect OpenStreetMap usage policy', async () => {
      // Arrange
      const lat = 12.9716;
      const lng = 77.5946;
      const cachedResult = {
        display_name: 'Cached Address',
      };

      redisMock.get.mockResolvedValue(JSON.stringify(cachedResult));

      // Act
      const result = await client.reverseGeocode(lat, lng);

      // Assert - Should return cached result without API call
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
      expect(redisMock.get).toHaveBeenCalledWith(
        expect.stringContaining('geo:rev:')
      );
    });
  });
});

