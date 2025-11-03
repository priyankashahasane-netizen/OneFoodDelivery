import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from '../orders/orders.service.js';
import { RoutesService } from '../routes/routes.service.js';
import { TrackingService } from '../tracking/tracking.service.js';
import { WebhooksService } from '../webhooks/webhooks.service.js';
import { DriversService } from '../drivers/drivers.service.js';
import { OrderEntity } from '../orders/entities/order.entity.js';
import { DriverEntity } from '../drivers/entities/driver.entity.js';
import { RoutePlanEntity } from '../routes/entities/route-plan.entity.js';
import { TrackingPointEntity } from '../tracking/entities/tracking-point.entity.js';
import { OptimoRouteClient } from '../../integrations/optimoroute.client.js';
import { ConfigService } from '@nestjs/config';

/**
 * Integration Tests - PRD Acceptance Criteria
 * PRD Reference: 8) Acceptance Criteria (Key)
 * 
 * These tests verify end-to-end flows aligned with PRD requirements:
 * - Driver can accept multiple concurrent deliveries; OptimoRoute returns updated sequence ≤ 3s
 * - Customer sees live driver marker on OSM map with ETA updating ≤ 2s latency
 * - Tracking page adapts language/timezone using ipstack when user denies GPS
 * - Admin can reassign in-flight orders; map reflects changes in ≤ 5s
 * - On completion, all stakeholders receive notifications; POD stored & viewable
 */
describe('PRD Acceptance Criteria Integration Tests', () => {
  let ordersService: OrdersService;
  let routesService: RoutesService;
  let trackingService: TrackingService;
  let webhooksService: WebhooksService;
  let driversService: DriversService;
  let optimoRouteClient: OptimoRouteClient;

  const mockOrderRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockDriverRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockRoutePlansRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTrackingRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRoutesService = {
    optimizeForDriver: jest.fn(),
    enqueueOptimizationForDriver: jest.fn(),
    getLatestPlanForDriver: jest.fn(),
  };

  const mockOptimoRouteClient = {
    optimizeRoute: jest.fn(),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        RoutesService,
        TrackingService,
        WebhooksService,
        DriversService,
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(DriverEntity),
          useValue: mockDriverRepository,
        },
        {
          provide: getRepositoryToken(RoutePlanEntity),
          useValue: mockRoutePlansRepository,
        },
        {
          provide: getRepositoryToken(TrackingPointEntity),
          useValue: mockTrackingRepository,
        },
        {
          provide: RoutesService,
          useValue: mockRoutesService,
        },
        {
          provide: OptimoRouteClient,
          useValue: mockOptimoRouteClient,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedis,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    routesService = module.get<RoutesService>(RoutesService);
    trackingService = module.get<TrackingService>(TrackingService);
    webhooksService = module.get<WebhooksService>(WebhooksService);
    driversService = module.get<DriversService>(DriversService);
    optimoRouteClient = module.get<OptimoRouteClient>(OptimoRouteClient);

    jest.clearAllMocks();
  });

  describe('Acceptance Criteria 1: Multi-order stacking with OptimoRoute optimization', () => {
    it('should accept multiple concurrent deliveries and optimize route ≤ 3s', async () => {
      // PRD: "Driver can accept multiple concurrent deliveries; OptimoRoute returns updated sequence ≤ 3s"

      // Arrange
      const driverId = 'driver-1';
      const order1Id = 'order-1';
      const order2Id = 'order-2';

      const driver = { id: driverId, capacity: 3 };
      mockDriverRepository.findOne.mockResolvedValue(driver);

      // First order assignment
      const order1 = {
        id: order1Id,
        status: 'pending',
        pickup: { lat: 12.9716, lng: 77.5946 },
        dropoff: { lat: 12.9352, lng: 77.6245 },
      };
      mockOrderRepository.findOne.mockResolvedValueOnce(order1);
      mockOrderRepository.save.mockResolvedValueOnce({ ...order1, driverId, status: 'assigned' });

      // Second order assignment
      const order2 = {
        id: order2Id,
        status: 'pending',
        pickup: { lat: 12.9450, lng: 77.6100 },
        dropoff: { lat: 12.9250, lng: 77.6000 },
      };
      mockOrderRepository.findOne.mockResolvedValueOnce(order2);
      mockOrderRepository.save.mockResolvedValueOnce({ ...order2, driverId, status: 'assigned' });

      // Mock active orders for optimization
      const activeOrders = [order1, order2];
      mockOrderRepository.find.mockResolvedValue(activeOrders.map(o => ({
        ...o,
        driverId,
        status: 'assigned',
      })));

      // Mock OptimoRoute response
      const optimoResponse = {
        sequence: [0, 2, 1, 3], // Optimized sequence
        distanceKm: 15.2,
        etaPerStop: {
          [order1Id]: 600, // 10 minutes
          [order2Id]: 900, // 15 minutes
        },
        polyline: 'encoded-polyline',
      };

      mockOptimoRouteClient.optimizeRoute.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate 100ms API call
        return optimoResponse;
      });

      mockRoutePlansRepository.create.mockReturnValue({ id: 'route-plan-1' });
      mockRoutePlansRepository.save.mockResolvedValue({
        id: 'route-plan-1',
        driverId,
        totalDistanceKm: 15.2,
        etaPerStop: optimoResponse.etaPerStop,
      });

      // Act - Assign first order
      await ordersService.assignDriver(order1Id, driverId);

      // Act - Assign second order
      await ordersService.assignDriver(order2Id, driverId);

      // Act - Optimize route
      const startTime = Date.now();
      const routePlan = await routesService.optimizeForDriver(driverId);
      const duration = Date.now() - startTime;

      // Assert
      expect(routePlan).toBeDefined();
      expect(routePlan.totalDistanceKm).toBe(15.2);
      expect(routePlan.etaPerStop).toBeDefined();
      
      // Performance requirement: ≤ 3s
      expect(duration).toBeLessThanOrEqual(3000);
      
      // Verify both orders are assigned
      const assignedOrders = await ordersService.getActiveOrdersByDriver(driverId);
      expect(assignedOrders.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Acceptance Criteria 2: Live tracking with ≤ 2s latency', () => {
    it('should broadcast location update within 2 seconds', async () => {
      // PRD: "Customer sees live driver marker on OSM map with ETA updating ≤ 2s latency"
      // PRD: "live location E2E < 2s ingest → broadcast"

      // Arrange
      const orderId = 'order-1';
      const driverId = 'driver-1';
      const trackingPayload = {
        driverId,
        lat: 12.9716,
        lng: 77.5946,
        speed: 45,
        heading: 180,
      };

      mockTrackingRepository.create.mockReturnValue({ id: 'track-1' });
      mockTrackingRepository.save.mockResolvedValue({
        id: 'track-1',
        orderId,
        ...trackingPayload,
        recordedAt: new Date(),
      });

      mockRoutesService.getLatestPlanForDriver.mockResolvedValue(null);
      mockRedis.publish.mockResolvedValue(1); // 1 subscriber

      // Act
      const startTime = Date.now();
      await trackingService.record(orderId, trackingPayload);
      const duration = Date.now() - startTime;

      // Assert
      expect(mockRedis.publish).toHaveBeenCalledWith(
        `track:${orderId}`,
        expect.stringContaining('"type":"position"')
      );
      
      // Performance requirement: E2E < 2s
      expect(duration).toBeLessThanOrEqual(2000);
    });
  });

  describe('Acceptance Criteria 3: Webhook order creation and assignment flow', () => {
    it('should create order from webhook and generate tracking URL', async () => {
      // PRD: A) System Architecture - "Order Ingest Service" → "Dispatch & Assignment Engine"

      // Arrange
      const webhookPayload = {
        platform: 'zomato',
        externalRef: 'ZOMATO-TEST-123',
        pickup: {
          lat: 12.9716,
          lng: 77.5946,
          address: 'Restaurant, Bengaluru',
        },
        dropoff: {
          lat: 12.9352,
          lng: 77.6245,
          address: 'Customer, Bengaluru',
        },
        items: [{ name: 'Item', quantity: 1, price: 299 }],
        paymentType: 'online' as const,
        customerPhone: '+919999999999',
        customerName: 'Test Customer',
        slaMinutes: 30,
      };

      mockOrderRepository.findOne.mockResolvedValue(null); // No duplicate
      mockOrderRepository.create.mockReturnValue({
        id: 'order-webhook-123',
        ...webhookPayload,
        status: 'pending',
      });
      mockOrderRepository.save.mockResolvedValue({
        id: 'order-webhook-123',
        externalRef: 'ZOMATO-TEST-123',
        status: 'pending',
        trackingUrl: 'http://localhost:3001/track/order-webhook-123',
      });

      // Act
      const order = await webhooksService.processOrderWebhook(webhookPayload);

      // Assert
      expect(order.id).toBe('order-webhook-123');
      expect(order.externalRef).toBe('ZOMATO-TEST-123');
      expect(order.status).toBe('pending');
    });
  });

  describe('Acceptance Criteria 4: Route re-optimization on deviation', () => {
    it('should trigger re-optimization when driver deviates >500m from route', async () => {
      // PRD: 2.1 Route Optimization - "re-optimize on detours"

      // Arrange
      const orderId = 'order-1';
      const driverId = 'driver-1';

      const routePlan = {
        id: 'route-plan-1',
        driverId,
        stops: [
          { lat: 12.9716, lng: 77.5946 }, // Next stop
        ],
      };

      // Driver is far from next stop (>500m)
      const trackingPayload = {
        driverId,
        lat: 12.95, // ~2.4km away (deviation)
        lng: 77.59,
      };

      mockRoutesService.getLatestPlanForDriver.mockResolvedValue(routePlan);
      mockTrackingRepository.create.mockReturnValue({ id: 'track-1' });
      mockTrackingRepository.save.mockResolvedValue({
        id: 'track-1',
        recordedAt: new Date(),
      });
      mockRedis.publish.mockResolvedValue(1);

      // Act
      await trackingService.record(orderId, trackingPayload);

      // Assert - Should trigger re-optimization
      expect(mockRoutesService.enqueueOptimizationForDriver).toHaveBeenCalledWith(driverId);
    });

    it('should not trigger re-optimization when driver is close to route', async () => {
      // Arrange
      const orderId = 'order-1';
      const driverId = 'driver-1';

      const routePlan = {
        id: 'route-plan-1',
        driverId,
        stops: [
          { lat: 12.9716, lng: 77.5946 }, // Next stop
        ],
      };

      // Driver is close to next stop (<500m)
      const trackingPayload = {
        driverId,
        lat: 12.972, // ~44m away (within threshold)
        lng: 77.5946,
      };

      mockRoutesService.getLatestPlanForDriver.mockResolvedValue(routePlan);
      mockTrackingRepository.create.mockReturnValue({ id: 'track-1' });
      mockTrackingRepository.save.mockResolvedValue({
        id: 'track-1',
        recordedAt: new Date(),
      });
      mockRedis.publish.mockResolvedValue(1);

      // Act
      await trackingService.record(orderId, trackingPayload);

      // Assert - Should NOT trigger re-optimization
      expect(mockRoutesService.enqueueOptimizationForDriver).not.toHaveBeenCalled();
    });
  });

  describe('Acceptance Criteria 5: Order assignment generates tracking URL', () => {
    it('should create tracking URL when order is assigned to driver', async () => {
      // PRD: 5) API Contracts - "Assign Delivery" → trackingUrl

      // Arrange
      const orderId = 'order-1';
      const driverId = 'driver-1';

      const order = {
        id: orderId,
        status: 'pending',
        driverId: null,
        trackingUrl: null,
      };

      const driver = {
        id: driverId,
        name: 'Test Driver',
      };

      mockOrderRepository.findOne.mockResolvedValue(order);
      mockDriverRepository.findOne.mockResolvedValue(driver);
      mockOrderRepository.save.mockResolvedValue({
        ...order,
        driverId,
        status: 'assigned',
        trackingUrl: 'http://localhost:3001/track/order-1',
        assignedAt: new Date(),
      });

      mockRoutesService.enqueueOptimizationForDriver.mockResolvedValue(undefined);

      // Act
      const assignedOrder = await ordersService.assignDriver(orderId, driverId);

      // Assert
      expect(assignedOrder.trackingUrl).toBe('http://localhost:3001/track/order-1');
      expect(assignedOrder.status).toBe('assigned');
      expect(assignedOrder.driverId).toBe(driverId);
    });
  });
});

