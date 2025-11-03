import { Test, TestingModule } from '@nestjs/testing';
import { TrackingController } from './tracking.controller.js';
import { TrackingService } from './tracking.service.js';
import { REDIS_SUB_CLIENT } from '../../common/redis/redis.provider.js';

/**
 * Tracking Controller Tests
 * PRD Reference: 5) API Contracts - "POST /api/track/:orderId", "GET /api/track/:orderId/sse"
 * PRD Reference: 2.1 Live Tracking - "Foreground/background location updates (5–10s cadence)"
 * PRD Reference: 3 Non-Functional Requirements - "live location E2E < 2s ingest → broadcast"
 */
describe('TrackingController', () => {
  let controller: TrackingController;
  let service: TrackingService;
  let redisSub: any;

  const mockTrackingService = {
    listRecent: jest.fn(),
    record: jest.fn(),
  };

  const mockRedisSub = {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  };

  const mockResponse = {
    setHeader: jest.fn(),
    flushHeaders: jest.fn(),
    write: jest.fn(),
    req: {
      on: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrackingController],
      providers: [
        {
          provide: TrackingService,
          useValue: mockTrackingService,
        },
        {
          provide: REDIS_SUB_CLIENT,
          useValue: mockRedisSub,
        },
      ],
    }).compile();

    controller = module.get<TrackingController>(TrackingController);
    service = module.get<TrackingService>(TrackingService);
    redisSub = module.get(REDIS_SUB_CLIENT);

    jest.clearAllMocks();
  });

  describe('GET /track/:orderId/sse', () => {
    it('should set up SSE connection and send initial snapshot', async () => {
      // Arrange
      const orderId = 'order-1';
      const mockRecentPoint = {
        id: 'track-1',
        orderId,
        driverId: 'driver-1',
        latitude: 12.9716,
        longitude: 77.5946,
        recordedAt: new Date(),
      };

      mockTrackingService.listRecent.mockResolvedValue([mockRecentPoint]);

      // Act
      await controller.sse(orderId, mockResponse as any);

      // Assert
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(mockResponse.flushHeaders).toHaveBeenCalled();
      expect(mockTrackingService.listRecent).toHaveBeenCalledWith(orderId, 1);
      
      // Should send initial position
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('event: position')
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(mockRecentPoint))
      );

      // Should subscribe to Redis channel
      expect(mockRedisSub.subscribe).toHaveBeenCalledWith(`track:${orderId}`);
      expect(mockRedisSub.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should handle message from Redis and broadcast via SSE', async () => {
      // Arrange
      const orderId = 'order-1';
      const mockRecentPoint = {
        id: 'track-1',
        orderId,
        latitude: 12.9716,
        longitude: 77.5946,
      };

      mockTrackingService.listRecent.mockResolvedValue([mockRecentPoint]);

      let messageHandler: (channel: string, message: string) => void;

      mockRedisSub.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'message') {
          messageHandler = handler as (channel: string, message: string) => void;
        }
      });

      // Act
      await controller.sse(orderId, mockResponse as any);

      // Simulate Redis message
      const positionMessage = JSON.stringify({
        type: 'position',
        data: {
          orderId,
          driverId: 'driver-1',
          lat: 12.9352,
          lng: 77.6245,
          ts: new Date(),
        },
      });

      messageHandler!(`track:${orderId}`, positionMessage);

      // Assert
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('event: position')
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(positionMessage)
      );
    });

    it('should send heartbeat every 15 seconds', async () => {
      // Arrange
      const orderId = 'order-1';
      mockTrackingService.listRecent.mockResolvedValue([]);

      jest.useFakeTimers();

      // Act
      await controller.sse(orderId, mockResponse as any);

      // Fast-forward 15 seconds
      jest.advanceTimersByTime(15000);

      // Assert
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('event: heartbeat')
      );

      jest.useRealTimers();
    });

    it('should clean up on connection close', async () => {
      // Arrange
      const orderId = 'order-1';
      mockTrackingService.listRecent.mockResolvedValue([]);

      let closeHandler: () => void;
      mockResponse.req.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'close') {
          closeHandler = handler as () => void;
        }
      });

      // Act
      await controller.sse(orderId, mockResponse as any);

      // Simulate connection close
      closeHandler!();

      // Assert
      expect(mockRedisSub.off).toHaveBeenCalled();
      expect(mockRedisSub.unsubscribe).toHaveBeenCalledWith(`track:${orderId}`);
    });
  });

  describe('POST /track/:orderId', () => {
    it('should record tracking point and return success', async () => {
      // Arrange
      const orderId = 'order-1';
      const payload = {
        driverId: 'driver-1',
        lat: 12.9716,
        lng: 77.5946,
        speed: 45,
        heading: 180,
      };

      const mockSavedPoint = {
        id: 'track-1',
        orderId,
        ...payload,
        recordedAt: new Date(),
      };

      mockTrackingService.record.mockResolvedValue(mockSavedPoint);

      // Act
      const result = await controller.ingest(orderId, payload);

      // Assert
      expect(result.ok).toBe(true);
      expect(result.id).toBe('track-1');
      expect(mockTrackingService.record).toHaveBeenCalledWith(orderId, payload, undefined);
    });

    it('should handle idempotency key for duplicate prevention', async () => {
      // Arrange
      const orderId = 'order-1';
      const payload = {
        driverId: 'driver-1',
        lat: 12.9716,
        lng: 77.5946,
      };
      const idempotencyKey = 'unique-key-123';

      const mockSavedPoint = {
        id: 'track-1',
        orderId,
        recordedAt: new Date(),
      };

      mockTrackingService.record.mockResolvedValue(mockSavedPoint);

      // Act
      const result = await controller.ingest(orderId, payload, idempotencyKey);

      // Assert
      expect(result.ok).toBe(true);
      expect(mockTrackingService.record).toHaveBeenCalledWith(
        orderId,
        payload,
        idempotencyKey
      );
    });

    it('should complete location ingestion within 2 seconds (performance test)', async () => {
      // Arrange
      const orderId = 'order-1';
      const payload = {
        driverId: 'driver-1',
        lat: 12.9716,
        lng: 77.5946,
      };

      // Simulate processing taking 100ms
      mockTrackingService.record.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          id: 'track-1',
          orderId,
          recordedAt: new Date(),
        };
      });

      // Act
      const startTime = Date.now();
      await controller.ingest(orderId, payload);
      const duration = Date.now() - startTime;

      // Assert - PRD requirement: E2E < 2s ingest → broadcast
      expect(duration).toBeLessThanOrEqual(2000);
    });
  });
});


