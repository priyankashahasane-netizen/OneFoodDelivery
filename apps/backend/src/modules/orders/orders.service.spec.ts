import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryBuilder } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { OrderEntity } from './entities/order.entity.js';
import { DriversService } from '../drivers/drivers.service.js';
import { RoutesService } from '../routes/routes.service.js';

/**
 * Orders Service Tests
 * PRD Reference: 2.1 Order Lifecycle - "accept/reject", "status updates", "multi-order stacking"
 */
describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepository: Repository<OrderEntity>;
  let driversService: DriversService;
  let routesService: RoutesService;

  const mockOrdersRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    merge: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDriversService = {
    findById: jest.fn(),
  };

  const mockRoutesService = {
    enqueueOptimizationForDriver: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: mockOrdersRepository,
        },
        {
          provide: DriversService,
          useValue: mockDriversService,
        },
        {
          provide: RoutesService,
          useValue: mockRoutesService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    ordersRepository = module.get<Repository<OrderEntity>>(getRepositoryToken(OrderEntity));
    driversService = module.get<DriversService>(DriversService);
    routesService = module.get<RoutesService>(RoutesService);

    jest.clearAllMocks();
  });

  describe('assignDriver', () => {
    it('should assign driver to order and trigger route optimization', async () => {
      // Arrange
      const orderId = 'order-1';
      const driverId = 'driver-1';
      const mockOrder = {
        id: orderId,
        status: 'pending',
        driverId: null,
        trackingUrl: null,
        pickup: { lat: 12.9716, lng: 77.5946 },
        dropoff: { lat: 12.9352, lng: 77.6245 },
      };
      const mockDriver = {
        id: driverId,
        name: 'Test Driver',
        latitude: 12.93,
        longitude: 77.62,
      };

      mockOrdersRepository.findOne.mockResolvedValue(mockOrder);
      mockDriversService.findById.mockResolvedValue(mockDriver);
      mockOrdersRepository.save.mockResolvedValue({
        ...mockOrder,
        driverId,
        status: 'assigned',
        trackingUrl: 'http://localhost:3001/track/order-1',
      });
      mockRoutesService.enqueueOptimizationForDriver.mockResolvedValue(undefined);

      // Act
      const result = await service.assignDriver(orderId, driverId);

      // Assert
      expect(result.driverId).toBe(driverId);
      expect(result.status).toBe('assigned');
      expect(result.trackingUrl).toBeDefined();
      expect(mockRoutesService.enqueueOptimizationForDriver).toHaveBeenCalledWith(driverId);
    });

    it('should throw NotFoundException if order not found', async () => {
      // Arrange
      mockOrdersRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.assignDriver('invalid-id', 'driver-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should preserve existing trackingUrl if already set', async () => {
      // Arrange
      const orderId = 'order-1';
      const driverId = 'driver-1';
      const existingTrackingUrl = 'https://app.example.com/track/order-1';
      const mockOrder = {
        id: orderId,
        trackingUrl: existingTrackingUrl,
      };
      const mockDriver = { id: driverId };

      mockOrdersRepository.findOne.mockResolvedValue(mockOrder);
      mockDriversService.findById.mockResolvedValue(mockDriver);
      mockOrdersRepository.save.mockResolvedValue(mockOrder);

      // Act
      const result = await service.assignDriver(orderId, driverId);

      // Assert
      expect(result.trackingUrl).toBe(existingTrackingUrl);
    });
  });

  describe('getAvailableOrders', () => {
    it('should return orders with pending or assigned status', async () => {
      // Arrange
      const mockOrders = [
        { id: 'order-1', status: 'pending', driverId: null },
        { id: 'order-2', status: 'assigned', driverId: 'driver-1' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrders),
      };

      mockOrdersRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getAvailableOrders();

      // Assert
      expect(result).toEqual(mockOrders);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'order.status IN (:...statuses)',
        { statuses: ['pending', 'assigned'] }
      );
    });

    it('should filter by driverId when provided', async () => {
      // Arrange
      const driverId = 'driver-1';
      const mockOrders = [
        { id: 'order-1', status: 'pending', driverId },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrders),
      };

      mockOrdersRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.getAvailableOrders(driverId);

      // Assert
      expect(result).toEqual(mockOrders);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(order.driverId IS NULL OR order.driverId = :driverId)',
        { driverId }
      );
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      // Arrange
      const orderId = 'order-1';
      const status = 'delivered';
      const mockOrder = {
        id: orderId,
        status: 'out_for_delivery',
      };

      mockOrdersRepository.findOne.mockResolvedValue(mockOrder);
      mockOrdersRepository.save.mockResolvedValue({ ...mockOrder, status });

      // Act
      const result = await service.updateStatus(orderId, status);

      // Assert
      expect(result.status).toBe(status);
      expect(mockOrdersRepository.save).toHaveBeenCalled();
    });

    it('should update trackingUrl if provided', async () => {
      // Arrange
      const orderId = 'order-1';
      const status = 'picked_up';
      const trackingUrl = 'https://app.example.com/track/order-1';
      const mockOrder = { id: orderId, status: 'assigned' };

      mockOrdersRepository.findOne.mockResolvedValue(mockOrder);
      mockOrdersRepository.save.mockResolvedValue({ ...mockOrder, status, trackingUrl });

      // Act
      const result = await service.updateStatus(orderId, status, { trackingUrl });

      // Assert
      expect(result.trackingUrl).toBe(trackingUrl);
    });
  });

  describe('getActiveOrdersByDriver', () => {
    it('should return active orders excluding delivered/cancelled', async () => {
      // Arrange
      const driverId = 'driver-1';
      const mockActiveOrders = [
        { id: 'order-1', driverId, status: 'assigned' },
        { id: 'order-2', driverId, status: 'picked_up' },
      ];

      mockOrdersRepository.find.mockResolvedValue(mockActiveOrders);

      // Act
      const result = await service.getActiveOrdersByDriver(driverId);

      // Assert
      expect(result).toEqual(mockActiveOrders);
      expect(mockOrdersRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
          order: { assignedAt: 'DESC' },
        })
      );
    });
  });
});


