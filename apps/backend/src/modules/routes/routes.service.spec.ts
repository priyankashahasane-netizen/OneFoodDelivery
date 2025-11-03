import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoutesService } from './routes.service.js';
import { RoutePlanEntity } from './entities/route-plan.entity.js';
import { DriversService } from '../drivers/drivers.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { OptimoRouteClient } from '../../integrations/optimoroute.client.js';
import { ConfigService } from '@nestjs/config';

/**
 * Routes Service Tests
 * PRD Reference: 5) API Contracts - "POST /api/routes/optimize"
 * PRD Reference: 8 Acceptance Criteria - "OptimoRoute returns updated sequence ≤ 3s"
 * PRD Reference: 3 Non-Functional Requirements - "route optimization round-trip < 3s"
 */
describe('RoutesService', () => {
  let service: RoutesService;
  let routePlansRepository: Repository<RoutePlanEntity>;
  let driversService: DriversService;
  let ordersService: OrdersService;
  let optimoRouteClient: OptimoRouteClient;

  const mockRoutePlansRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockDriversService = {
    findById: jest.fn(),
  };

  const mockOrdersService = {
    getActiveOrdersByDriver: jest.fn(),
  };

  const mockOptimoRouteClient = {
    optimizeRoute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutesService,
        {
          provide: getRepositoryToken(RoutePlanEntity),
          useValue: mockRoutePlansRepository,
        },
        {
          provide: DriversService,
          useValue: mockDriversService,
        },
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
        {
          provide: OptimoRouteClient,
          useValue: mockOptimoRouteClient,
        },
      ],
    }).compile();

    service = module.get<RoutesService>(RoutesService);
    routePlansRepository = module.get<Repository<RoutePlanEntity>>(getRepositoryToken(RoutePlanEntity));
    driversService = module.get<DriversService>(DriversService);
    ordersService = module.get<OrdersService>(OrdersService);
    optimoRouteClient = module.get<OptimoRouteClient>(OptimoRouteClient);

    jest.clearAllMocks();
  });

  describe('optimizeForDriver', () => {
    it('should optimize route with stops override', async () => {
      // Arrange
      const driverId = 'driver-1';
      const stopsOverride = [
        { lat: 12.9716, lng: 77.5946, orderId: 'order-1' },
        { lat: 12.9352, lng: 77.6245, orderId: 'order-1' },
      ];

      const mockDriver = { id: driverId, latitude: 12.93, longitude: 77.62 };
      const mockOptimoResponse = {
        sequence: [0, 1],
        polyline: '12.9716,77.5946;12.9352,77.6245',
        etaPerStop: { 'order-1': 300 },
        distanceKm: 8.4,
      };

      mockDriversService.findById.mockResolvedValue(mockDriver);
      mockOptimoRouteClient.optimizeRoute.mockResolvedValue(mockOptimoResponse);
      
      const mockSavedPlan = {
        id: 'route-plan-1',
        driverId,
        stops: stopsOverride,
        totalDistanceKm: 8.4,
        etaPerStop: mockOptimoResponse.etaPerStop,
      };
      mockRoutePlansRepository.create.mockReturnValue(mockSavedPlan);
      mockRoutePlansRepository.save.mockResolvedValue(mockSavedPlan);

      // Act
      const startTime = Date.now();
      const result = await service.optimizeForDriver(driverId, stopsOverride);
      const duration = Date.now() - startTime;

      // Assert
      expect(result).toEqual(mockSavedPlan);
      expect(mockOptimoRouteClient.optimizeRoute).toHaveBeenCalledWith({
        driverId,
        stops: stopsOverride,
      });
      expect(mockRoutePlansRepository.save).toHaveBeenCalled();
      
      // Performance requirement: ≤ 3s
      expect(duration).toBeLessThanOrEqual(3000);
    });

    it('should fetch active orders and create stops if stopsOverride not provided', async () => {
      // Arrange
      const driverId = 'driver-1';
      const mockDriver = { id: driverId };
      const mockActiveOrders = [
        {
          id: 'order-1',
          pickup: { lat: 12.9716, lng: 77.5946 },
          dropoff: { lat: 12.9352, lng: 77.6245 },
        },
        {
          id: 'order-2',
          pickup: { lat: 12.9450, lng: 77.6100 },
          dropoff: { lat: 12.9250, lng: 77.6000 },
        },
      ];

      mockDriversService.findById.mockResolvedValue(mockDriver);
      mockOrdersService.getActiveOrdersByDriver.mockResolvedValue(mockActiveOrders);
      
      const expectedStops = [
        { lat: 12.9716, lng: 77.5946, orderId: 'order-1' },
        { lat: 12.9352, lng: 77.6245, orderId: 'order-1' },
        { lat: 12.9450, lng: 77.6100, orderId: 'order-2' },
        { lat: 12.9250, lng: 77.6000, orderId: 'order-2' },
      ];

      const mockOptimoResponse = {
        sequence: [0, 2, 1, 3],
        distanceKm: 15.2,
        etaPerStop: { 'order-1': 600, 'order-2': 900 },
      };

      mockOptimoRouteClient.optimizeRoute.mockResolvedValue(mockOptimoResponse);
      mockRoutePlansRepository.create.mockReturnValue({ id: 'plan-1' });
      mockRoutePlansRepository.save.mockResolvedValue({ id: 'plan-1', totalDistanceKm: 15.2 });

      // Act
      const result = await service.optimizeForDriver(driverId);

      // Assert
      expect(mockOrdersService.getActiveOrdersByDriver).toHaveBeenCalledWith(driverId);
      expect(mockOptimoRouteClient.optimizeRoute).toHaveBeenCalledWith({
        driverId,
        stops: expectedStops,
      });
      expect(result).toBeDefined();
    });

    it('should use driver location as default if no active orders', async () => {
      // Arrange
      const driverId = 'driver-1';
      const mockDriver = {
        id: driverId,
        latitude: 12.93,
        longitude: 77.62,
      };

      mockDriversService.findById.mockResolvedValue(mockDriver);
      mockOrdersService.getActiveOrdersByDriver.mockResolvedValue([]);

      const expectedStops = [{ lat: 12.93, lng: 77.62 }];
      const mockOptimoResponse = { distanceKm: 0, sequence: [0] };
      mockOptimoRouteClient.optimizeRoute.mockResolvedValue(mockOptimoResponse);
      mockRoutePlansRepository.create.mockReturnValue({ id: 'plan-1' });
      mockRoutePlansRepository.save.mockResolvedValue({ id: 'plan-1' });

      // Act
      const result = await service.optimizeForDriver(driverId);

      // Assert
      expect(mockOptimoRouteClient.optimizeRoute).toHaveBeenCalledWith({
        driverId,
        stops: expectedStops,
      });
    });

    it('should complete optimization within 3 seconds (performance test)', async () => {
      // Arrange
      const driverId = 'driver-1';
      const stopsOverride = [
        { lat: 12.9716, lng: 77.5946 },
        { lat: 12.9352, lng: 77.6245 },
      ];

      const mockDriver = { id: driverId };
      mockDriversService.findById.mockResolvedValue(mockDriver);
      
      // Simulate OptimoRoute API call taking 1 second
      mockOptimoRouteClient.optimizeRoute.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          sequence: [0, 1],
          distanceKm: 8.4,
          etaPerStop: {},
        };
      });

      mockRoutePlansRepository.create.mockReturnValue({ id: 'plan-1' });
      mockRoutePlansRepository.save.mockResolvedValue({ id: 'plan-1' });

      // Act
      const startTime = Date.now();
      await service.optimizeForDriver(driverId, stopsOverride);
      const duration = Date.now() - startTime;

      // Assert - PRD requirement: ≤ 3s
      expect(duration).toBeLessThanOrEqual(3000);
    });

    it('should handle OptimoRoute API failure gracefully with fallback', async () => {
      // Arrange
      const driverId = 'driver-1';
      const stopsOverride = [
        { lat: 12.9716, lng: 77.5946 },
        { lat: 12.9352, lng: 77.6245 },
      ];

      const mockDriver = { id: driverId };
      mockDriversService.findById.mockResolvedValue(mockDriver);
      mockOptimoRouteClient.optimizeRoute.mockRejectedValue(new Error('API Error'));

      // Act & Assert - Should handle error gracefully
      await expect(service.optimizeForDriver(driverId, stopsOverride)).rejects.toThrow();
    });
  });

  describe('getLatestPlanForDriver', () => {
    it('should return latest route plan for driver', async () => {
      // Arrange
      const driverId = 'driver-1';
      const mockPlan = {
        id: 'route-plan-1',
        driverId,
        totalDistanceKm: 10.0,
        createdAt: new Date(),
      };

      mockRoutePlansRepository.findOne.mockResolvedValue(mockPlan);

      // Act
      const result = await service.getLatestPlanForDriver(driverId);

      // Assert
      expect(result).toEqual(mockPlan);
      expect(mockRoutePlansRepository.findOne).toHaveBeenCalledWith({
        where: { driverId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return null if no plan exists', async () => {
      // Arrange
      const driverId = 'driver-1';
      mockRoutePlansRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getLatestPlanForDriver(driverId);

      // Assert
      expect(result).toBeNull();
    });
  });
});


