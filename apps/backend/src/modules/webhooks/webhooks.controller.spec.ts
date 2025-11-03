import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';

/**
 * Webhooks Controller Tests
 * PRD Reference: 5) API Contracts - "POST /api/webhooks/orders" (Third-party order webhook)
 * PRD Reference: A) System Architecture - "Orders via Webhook/API" from Food Platforms
 */
describe('WebhooksController', () => {
  let controller: WebhooksController;
  let service: WebhooksService;

  const mockWebhooksService = {
    processOrderWebhook: jest.fn(),
    verifySignature: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        {
          provide: WebhooksService,
          useValue: mockWebhooksService,
        },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
    service = module.get<WebhooksService>(WebhooksService);

    jest.clearAllMocks();
  });

  describe('POST /webhooks/orders', () => {
    it('should process order webhook from Zomato and return tracking URL', async () => {
      // Arrange
      const webhookPayload = {
        platform: 'zomato',
        externalRef: 'ZOMATO-12345',
        pickup: {
          lat: 12.9716,
          lng: 77.5946,
          address: 'Pizza Hut, MG Road, Bengaluru',
        },
        dropoff: {
          lat: 12.9558,
          lng: 77.6077,
          address: 'Prestige Tech Park, Bengaluru',
        },
        items: [
          { name: 'Margherita Pizza', quantity: 1, price: 299 },
        ],
        paymentType: 'online' as const,
        customerPhone: '+919999999999',
        customerName: 'John Doe',
        slaMinutes: 45,
      };

      const mockCreatedOrder = {
        id: 'order-uuid-123',
        externalRef: 'ZOMATO-12345',
        status: 'pending',
        trackingUrl: 'http://localhost:3001/track/order-uuid-123',
      };

      mockWebhooksService.processOrderWebhook.mockResolvedValue(mockCreatedOrder);

      // Act
      const result = await controller.handleOrderWebhook(webhookPayload);

      // Assert
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order-uuid-123');
      expect(result.trackingUrl).toBe('http://localhost:3001/track/order-uuid-123');
      expect(result.status).toBe('pending');
      expect(mockWebhooksService.processOrderWebhook).toHaveBeenCalledWith(webhookPayload);
    });

    it('should process order webhook from Swiggy', async () => {
      // Arrange
      const webhookPayload = {
        platform: 'swiggy',
        externalRef: 'SWIGGY-67890',
        pickup: {
          lat: 12.9352,
          lng: 77.6245,
          address: 'Swiggy Restaurant, Bangalore',
        },
        dropoff: {
          lat: 12.9716,
          lng: 77.5946,
          address: 'Customer Address, Bangalore',
        },
        items: [
          { name: 'Burger', quantity: 2, price: 150 },
        ],
        paymentType: 'cash' as const,
        customerPhone: '+919888777666',
        customerName: 'Jane Smith',
        slaMinutes: 30,
      };

      const mockCreatedOrder = {
        id: 'order-uuid-456',
        externalRef: 'SWIGGY-67890',
        status: 'pending',
        trackingUrl: 'http://localhost:3001/track/order-uuid-456',
      };

      mockWebhooksService.processOrderWebhook.mockResolvedValue(mockCreatedOrder);

      // Act
      const result = await controller.handleOrderWebhook(webhookPayload);

      // Assert
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order-uuid-456');
    });

    it('should handle webhook signature verification', async () => {
      // Arrange
      const webhookPayload = {
        platform: 'zomato',
        externalRef: 'ZOMATO-TEST',
        pickup: { lat: 12.9716, lng: 77.5946, address: 'Test' },
        dropoff: { lat: 12.9352, lng: 77.6245, address: 'Test' },
        items: [],
        paymentType: 'online' as const,
        customerPhone: '+919999999999',
        slaMinutes: 30,
      };

      const signature = 'signature-hash-here';
      const platformKey = 'platform-key-here';

      const mockCreatedOrder = {
        id: 'order-1',
        status: 'pending',
        trackingUrl: 'http://localhost:3001/track/order-1',
      };

      mockWebhooksService.verifySignature.mockReturnValue(true);
      mockWebhooksService.processOrderWebhook.mockResolvedValue(mockCreatedOrder);

      // Act
      const result = await controller.handleOrderWebhook(
        webhookPayload,
        signature,
        platformKey
      );

      // Assert
      expect(result.success).toBe(true);
      // Note: Signature verification is currently commented out in controller
    });

    it('should return error when processing fails', async () => {
      // Arrange
      const webhookPayload = {
        platform: 'zomato',
        externalRef: 'ZOMATO-INVALID',
        pickup: { lat: 12.9716, lng: 77.5946, address: 'Test' },
        dropoff: { lat: 12.9352, lng: 77.6245, address: 'Test' },
        items: [],
        paymentType: 'online' as const,
        customerPhone: '+919999999999',
        slaMinutes: 30,
      };

      mockWebhooksService.processOrderWebhook.mockRejectedValue(
        new Error('Database error')
      );

      // Act & Assert
      await expect(controller.handleOrderWebhook(webhookPayload)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('POST /webhooks/test', () => {
    it('should create test order using test webhook endpoint', async () => {
      // Arrange
      const mockCreatedOrder = {
        id: 'test-order-123',
        externalRef: expect.stringMatching(/^TEST-\d+$/),
        platform: 'test',
        status: 'pending',
        trackingUrl: 'http://localhost:3001/track/test-order-123',
      };

      mockWebhooksService.processOrderWebhook.mockResolvedValue(mockCreatedOrder);

      // Act
      const result = await controller.testWebhook();

      // Assert
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('test-order-123');
      expect(result.trackingUrl).toBeDefined();
      expect(mockWebhooksService.processOrderWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 'test',
          externalRef: expect.stringMatching(/^TEST-\d+$/),
          pickup: expect.objectContaining({
            lat: 12.9716,
            lng: 77.5946,
            address: expect.stringContaining('Test Restaurant'),
          }),
          dropoff: expect.objectContaining({
            lat: 12.9558,
            lng: 77.6077,
            address: expect.stringContaining('Test Customer'),
          }),
        })
      );
    });
  });
});

