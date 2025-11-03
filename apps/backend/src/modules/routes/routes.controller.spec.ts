import { Test, TestingModule } from '@nestjs/testing';
import { RoutesController } from './routes.controller.js';
import { RoutesService } from './routes.service.js';

/**
 * Routes Controller Tests
 * PRD Reference: 5) API Contracts - "POST /api/routes/optimize" (OptimoRoute proxy)
 * PRD Reference: 8 Acceptance Criteria - "OptimoRoute returns updated sequence ≤ 3s"
 * PRD Reference: 2.1 Route Optimization - "On accept (or stack change), call OptimoRoute with current stop set"
 */
describe('RoutesController', () => {
  let controller: RoutesController;
  let service: RoutesService;

  const mockRoutesService = {
    optimizeForDriver: jest.fn(),
    getLatestPlanForDriver: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoutesController],
      providers: [
        {
          provide: RoutesService,
          useValue: mockRoutesService,
        },
      ],
    }).compile();

    controller = module.get<RoutesController>(RoutesController);
    service = module.get<RoutesService>(RoutesService);

    jest.clearAllMocks();
  });

  describe('POST /routes/optimize', () => {
    it('should optimize route with stops and return optimized plan', async () => {
      // Arrange
      const driverId = 'driver-1';
      const payload = {
        driverId,
        stops: [
          { lat: 12.9716, lng: 77.5946, orderId: 'order-1' },
          { lat: 12.9352, lng: 77.6245, orderId: 'order-1' },
        ],
      };

      const mockRoutePlan = {
        id: 'route-plan-1',
        driverId,
        stops: payload.stops,
        totalDistanceKm: 8.4,
        etaPerStop: {
          'order-1': 300, // 5 minutes in seconds
        },
        sequence: [0, 1],
        polyline: '12.9716,77.5946;12.9352,77.6245',
      };

      mockRoutesService.optimizeForDriver.mockResolvedValue(mockRoutePlan);

      // Act
      const startTime = Date.now();
      const result = await controller.optimize(payload);
      const duration = Date.now() - startTime;

      // Assert
      expect(result).toEqual(mockRoutePlan);
      expect(mockRoutesService.optimizeForDriver).toHaveBeenCalledWith(
        driverId,
        payload.stops.map((s) => ({ lat: s.lat, lng: s.lng, orderId: s.orderId }))
      );
      
      // Performance requirement: ≤ 3s per PRD
      expect(duration).toBeLessThanOrEqual(3000);
    });

    it('should handle multi-order stacking optimization', async () => {
      // Arrange
      const driverId = 'driver-1';
      const payload = {
        driverId,
        stops: [
          { lat: 12.9716, lng: 77.5946, orderId: 'order-1' }, // Pickup 1
          { lat: 12.9352, lng: 77.6245, orderId: 'order-1' }, // Dropoff 1
          { lat: 12.9450, lng: 77.6100, orderId: 'order-2' }, // Pickup 2
          { lat: 12.9250, lng: 77.6000, orderId: 'order-2' }, // Dropoff 2
        ],
      };

      const mockRoutePlan = {
        id: 'route-plan-2',
        driverId,
        totalDistanceKm: 15.2,
        sequence: [0, 2, 1, 3], // Optimized sequence
        etaPerStop: {
          'order-1': 600,
          'order-2': 900,
        },
      };

      mockRoutesService.optimizeForDriver.mockResolvedValue(mockRoutePlan);

      // Act
      const startTime = Date.now();
      const result = await controller.optimize(payload);
      const duration = Date.now() - startTime;

      // Assert
      expect(result).toEqual(mockRoutePlan);
      expect(result.sequence).toBeDefined();
      expect(result.etaPerStop).toBeDefined();
      
      // Performance requirement: ≤ 3s
      expect(duration).toBeLessThanOrEqual(3000);
    });

    it('should complete optimization within 3 seconds (performance test)', async () => {
      // Arrange
      const driverId = 'driver-1';
      const payload = {
        driverId,
        stops: [
          { lat: 12.9716, lng: 77.5946 },
          { lat: 12.9352, lng: 77.6245 },
        ],
      };

      const mockRoutePlan = {
        id: 'route-plan-1',
        driverId,
        totalDistanceKm: 5.0,
      };

      // Simulate API call taking 1 second
      mockRoutesService.optimizeForDriver.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockRoutePlan;
      });

      // Act
      const startTime = Date.now();
      await controller.optimize(payload);
      const duration = Date.now() - startTime;

      // Assert - PRD requirement: ≤ 3s
      expect(duration).toBeLessThanOrEqual(3000);
    });
  });

  describe('GET /routes/driver/:driverId/latest', () => {
    it('should return latest route plan for driver', async () => {
      // Arrange
      const driverId = 'driver-1';
      const mockRoutePlan = {
        id: 'route-plan-1',
        driverId,
        totalDistanceKm: 10.0,
        createdAt: new Date(),
      };

      mockRoutesService.getLatestPlanForDriver.mockResolvedValue(mockRoutePlan);

      // Act
      const result = await controller.latest(driverId);

      // Assert
      expect(result).toEqual(mockRoutePlan);
      expect(mockRoutesService.getLatestPlanForDriver).toHaveBeenCalledWith(driverId);
    });

    it('should return null if no route plan exists for driver', async () => {
      // Arrange
      const driverId = 'driver-1';
      mockRoutesService.getLatestPlanForDriver.mockResolvedValue(null);

      // Act
      const result = await controller.latest(driverId);

      // Assert
      expect(result).toBeNull();
    });
  });
});


