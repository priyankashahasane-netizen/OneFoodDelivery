import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhooksService } from './webhooks.service.js';
import { OrderEntity } from '../orders/entities/order.entity.js';

/**
 * Webhooks Service Tests
 * PRD Reference: A) System Architecture - "Order Ingest Service" processing webhooks
 */
describe('WebhooksService', () => {
  let service: WebhooksService;
  let orderRepository: Repository<OrderEntity>;

  const mockOrderRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: mockOrderRepository,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    orderRepository = module.get<Repository<OrderEntity>>(getRepositoryToken(OrderEntity));

    jest.clearAllMocks();
  });

  describe('processOrderWebhook', () => {
    it('should create new order from webhook payload', async () => {
      // Arrange
      const webhookDto = {
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

      mockOrderRepository.findOne.mockResolvedValue(null); // No duplicate
      mockOrderRepository.create.mockReturnValue({
        id: 'order-123',
        ...webhookDto,
        status: 'pending',
        slaSeconds: 45 * 60,
      });
      mockOrderRepository.save.mockResolvedValue({
        id: 'order-123',
        externalRef: 'ZOMATO-12345',
        status: 'pending',
        slaSeconds: 2700,
      });

      // Act
      const result = await service.processOrderWebhook(webhookDto);

      // Assert
      expect(result.id).toBe('order-123');
      expect(result.externalRef).toBe('ZOMATO-12345');
      expect(mockOrderRepository.findOne).toHaveBeenCalledWith({
        where: { externalRef: 'ZOMATO-12345' },
      });
      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          externalRef: 'ZOMATO-12345',
          status: 'pending',
          slaSeconds: 2700, // 45 minutes * 60
        })
      );
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('should return existing order if duplicate externalRef detected', async () => {
      // Arrange
      const webhookDto = {
        platform: 'zomato',
        externalRef: 'ZOMATO-12345',
        pickup: { lat: 12.9716, lng: 77.5946, address: 'Test' },
        dropoff: { lat: 12.9352, lng: 77.6245, address: 'Test' },
        items: [],
        paymentType: 'online' as const,
        customerPhone: '+919999999999',
        slaMinutes: 30,
      };

      const existingOrder = {
        id: 'order-existing',
        externalRef: 'ZOMATO-12345',
        status: 'assigned',
      };

      mockOrderRepository.findOne.mockResolvedValue(existingOrder);

      // Act
      const result = await service.processOrderWebhook(webhookDto);

      // Assert
      expect(result).toEqual(existingOrder);
      expect(mockOrderRepository.create).not.toHaveBeenCalled();
      expect(mockOrderRepository.save).not.toHaveBeenCalled();
    });

    it('should convert slaMinutes to slaSeconds', async () => {
      // Arrange
      const webhookDto = {
        platform: 'swiggy',
        externalRef: 'SWIGGY-67890',
        pickup: { lat: 12.9716, lng: 77.5946, address: 'Test' },
        dropoff: { lat: 12.9352, lng: 77.6245, address: 'Test' },
        items: [],
        paymentType: 'cash' as const,
        customerPhone: '+919888777666',
        slaMinutes: 30,
      };

      mockOrderRepository.findOne.mockResolvedValue(null);
      mockOrderRepository.create.mockReturnValue({
        id: 'order-1',
        slaSeconds: 1800,
      });
      mockOrderRepository.save.mockResolvedValue({
        id: 'order-1',
        slaSeconds: 1800,
      });

      // Act
      const result = await service.processOrderWebhook(webhookDto);

      // Assert
      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slaSeconds: 1800, // 30 minutes * 60
        })
      );
    });

    it('should handle multiple platforms (zomato, swiggy, ubereats)', async () => {
      // Arrange
      const platforms = ['zomato', 'swiggy', 'ubereats'];

      for (const platform of platforms) {
        const webhookDto = {
          platform,
          externalRef: `${platform.toUpperCase()}-TEST`,
          pickup: { lat: 12.9716, lng: 77.5946, address: 'Test' },
          dropoff: { lat: 12.9352, lng: 77.6245, address: 'Test' },
          items: [],
          paymentType: 'online' as const,
          customerPhone: '+919999999999',
          slaMinutes: 30,
        };

        mockOrderRepository.findOne.mockResolvedValue(null);
        mockOrderRepository.create.mockReturnValue({ id: `order-${platform}` });
        mockOrderRepository.save.mockResolvedValue({ id: `order-${platform}` });

        // Act
        const result = await service.processOrderWebhook(webhookDto);

        // Assert
        expect(result.id).toBe(`order-${platform}`);
      }
    });
  });

  describe('verifySignature', () => {
    it('should return true for signature verification (currently mocked)', () => {
      // Arrange
      const platform = 'zomato';
      const signature = 'signature-hash';
      const payload = {};

      // Act
      const result = service.verifySignature(platform, signature, payload);

      // Assert
      expect(result).toBe(true);
      // Note: Actual signature verification implementation would test HMAC/SHA256 here
    });
  });
});

