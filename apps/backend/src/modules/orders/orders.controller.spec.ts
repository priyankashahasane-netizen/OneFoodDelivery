import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from './entities/order.entity.js';
import { DriversService } from '../drivers/drivers.service.js';
import { RoutesService } from '../routes/routes.service.js';

/**
 * Orders Controller Tests
 * PRD Reference: 5) API Contracts - "POST /api/deliveries/assign", "PUT /api/orders/:id/assign"
 * PRD Reference: 2.1 Order Lifecycle - "accept/reject", "status updates"
 */
describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockOrdersService = {
    listOrders: jest.fn(),
    findById: jest.fn(),
    upsert: jest.fn(),
    assignDriver: jest.fn(),
    updateStatus: jest.fn(),
    getActiveOrdersByDriver: jest.fn(),
    getAvailableOrders: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);

    jest.clearAllMocks();
  });

  describe('GET /orders', () => {
    it('should return paginated list of orders', async () => {
      // Arrange
      const pagination = { page: 1, pageSize: 25 };
      const mockResult = {
        items: [{ id: 'order-1', status: 'pending' }],
        total: 1,
        page: 1,
        pageSize: 25,
      };
      mockOrdersService.listOrders.mockResolvedValue(mockResult);

      // Act
      const result = await controller.list(pagination);

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockOrdersService.listOrders).toHaveBeenCalledWith(pagination);
    });
  });

  describe('GET /orders/available', () => {
    it('should return available orders for driver', async () => {
      // Arrange
      const driverId = 'driver-1';
      const mockOrders = [
        { id: 'order-1', status: 'pending', driverId: null },
        { id: 'order-2', status: 'pending', driverId: null },
      ];
      mockOrdersService.getAvailableOrders.mockResolvedValue(mockOrders);

      // Act
      const result = await controller.getAvailable({ driverId });

      // Assert
      expect(result).toEqual(mockOrders);
      expect(mockOrdersService.getAvailableOrders).toHaveBeenCalledWith(driverId);
    });

    it('should return all unassigned orders when driverId is not provided', async () => {
      // Arrange
      const mockOrders = [
        { id: 'order-1', status: 'pending', driverId: null },
      ];
      mockOrdersService.getAvailableOrders.mockResolvedValue(mockOrders);

      // Act
      const result = await controller.getAvailable({});

      // Assert
      expect(result).toEqual(mockOrders);
      expect(mockOrdersService.getAvailableOrders).toHaveBeenCalledWith(undefined);
    });
  });

  describe('GET /orders/:id', () => {
    it('should return order by id', async () => {
      // Arrange
      const orderId = 'order-1';
      const mockOrder = {
        id: orderId,
        status: 'pending',
        pickup: { lat: 12.9716, lng: 77.5946 },
        dropoff: { lat: 12.9352, lng: 77.6245 },
      };
      mockOrdersService.findById.mockResolvedValue(mockOrder);

      // Act
      const result = await controller.getById(orderId);

      // Assert
      expect(result).toEqual(mockOrder);
      expect(mockOrdersService.findById).toHaveBeenCalledWith(orderId);
    });
  });

  describe('PUT /orders/:id/assign', () => {
    it('should assign order to driver and return assigned order', async () => {
      // Arrange
      const orderId = 'order-1';
      const driverId = 'driver-1';
      const mockAssignedOrder = {
        id: orderId,
        driverId,
        status: 'assigned',
        assignedAt: new Date(),
        trackingUrl: 'http://localhost:3001/track/order-1',
      };
      mockOrdersService.assignDriver.mockResolvedValue(mockAssignedOrder);

      // Act
      const result = await controller.assign(orderId, { driverId, orderId });

      // Assert
      expect(result).toEqual(mockAssignedOrder);
      expect(mockOrdersService.assignDriver).toHaveBeenCalledWith(orderId, driverId);
      expect(result.status).toBe('assigned');
      expect(result.trackingUrl).toBeDefined();
    });
  });

  describe('PUT /orders/:id/status', () => {
    it('should update order status', async () => {
      // Arrange
      const orderId = 'order-1';
      const status = 'picked_up';
      const mockUpdatedOrder = {
        id: orderId,
        status,
      };
      mockOrdersService.updateStatus.mockResolvedValue(mockUpdatedOrder);

      // Act
      const result = await controller.updateStatus(
        orderId,
        { status },
        { user: { sub: 'driver-1', role: 'driver' } }
      );

      // Assert
      expect(result).toEqual(mockUpdatedOrder);
      expect(mockOrdersService.updateStatus).toHaveBeenCalledWith(orderId, status);
    });

    it('should update status to out_for_delivery', async () => {
      // Arrange
      const orderId = 'order-1';
      const status = 'out_for_delivery';
      const mockUpdatedOrder = { id: orderId, status };
      mockOrdersService.updateStatus.mockResolvedValue(mockUpdatedOrder);

      // Act
      const result = await controller.updateStatus(
        orderId,
        { status },
        { user: { sub: 'driver-1' } }
      );

      // Assert
      expect(result.status).toBe('out_for_delivery');
    });
  });

  describe('GET /orders/driver/:driverId/active', () => {
    it('should return active orders for driver', async () => {
      // Arrange
      const driverId = 'driver-1';
      const mockActiveOrders = [
        { id: 'order-1', driverId, status: 'assigned' },
        { id: 'order-2', driverId, status: 'picked_up' },
      ];
      mockOrdersService.getActiveOrdersByDriver.mockResolvedValue(mockActiveOrders);

      // Act
      const result = await controller.getActiveByDriver(driverId);

      // Assert
      expect(result).toEqual(mockActiveOrders);
      expect(mockOrdersService.getActiveOrdersByDriver).toHaveBeenCalledWith(driverId);
    });
  });
});

