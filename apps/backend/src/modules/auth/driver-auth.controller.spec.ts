import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverOtpController } from './driver-auth.controller.js';
import { DriverEntity } from '../drivers/entities/driver.entity.js';
import { REDIS_CLIENT } from '../../common/redis/redis.provider.js';

/**
 * Auth Controller Tests
 * PRD Reference: 2.1 Auth & Profile - "OTP login"
 * PRD Reference: 5) API Contracts - "POST /api/auth/driver/otp/request" and "POST /api/auth/driver/otp/verify"
 */
describe('DriverOtpController', () => {
  let controller: DriverOtpController;
  let jwtService: JwtService;
  let driversRepository: Repository<DriverEntity>;
  let redisClient: any;

  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    status: 'ready',
    connect: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockDriversRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverOtpController],
      providers: [
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(DriverEntity),
          useValue: mockDriversRepository,
        },
        {
          provide: REDIS_CLIENT,
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    controller = module.get<DriverOtpController>(DriverOtpController);
    jwtService = module.get<JwtService>(JwtService);
    driversRepository = module.get<Repository<DriverEntity>>(getRepositoryToken(DriverEntity));
    redisClient = module.get(REDIS_CLIENT);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('POST /auth/driver/otp/request', () => {
    it('should request OTP and store in Redis', async () => {
      // Arrange
      const phone = '+919999999999';
      mockRedisClient.set.mockResolvedValue('OK');

      // Act
      const result = await controller.request({ phone });

      // Assert
      expect(result.ok).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `otp:driver:${phone}`,
        expect.stringMatching(/^\d{6}$/),
        'EX',
        300
      );
    });

    it('should return error if phone number is missing', async () => {
      // Act
      const result = await controller.request({ phone: '' });

      // Assert
      expect(result.ok).toBe(false);
      expect(result.message).toContain('Phone number is required');
      expect(mockRedisClient.set).not.toHaveBeenCalled();
    });

    it('should handle Redis connection errors gracefully', async () => {
      // Arrange
      const phone = '+919999999999';
      mockRedisClient.set.mockRejectedValue(new Error('Redis connection failed'));

      // Act
      const result = await controller.request({ phone });

      // Assert
      expect(result.ok).toBe(false);
      expect(result.message).toContain('Failed to send OTP');
    });
  });

  describe('POST /auth/driver/otp/verify', () => {
    it('should verify OTP and return JWT token for existing driver', async () => {
      // Arrange
      const phone = '+919999999999';
      const code = '123456';
      const driverId = '550e8400-e29b-41d4-a716-446655440001';
      
      mockRedisClient.get.mockResolvedValue(code);
      mockRedisClient.del.mockResolvedValue(1);
      
      const mockDriver = {
        id: driverId,
        phone,
        name: 'Test Driver',
        vehicleType: 'bike',
        capacity: 1,
        online: false,
      };
      mockDriversRepository.findOne.mockResolvedValue(mockDriver);
      mockJwtService.signAsync.mockResolvedValue('jwt-token-here');

      // Act
      const result = await controller.verify({ phone, code });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.access_token).toBe('jwt-token-here');
      expect(result.driverId).toBe(driverId);
      expect(mockRedisClient.get).toHaveBeenCalledWith(`otp:driver:${phone}`);
      expect(mockRedisClient.del).toHaveBeenCalledWith(`otp:driver:${phone}`);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: driverId, phone, role: 'driver' },
        expect.objectContaining({ secret: expect.any(String) })
      );
    });

    it('should auto-create driver if not exists on OTP verification', async () => {
      // Arrange
      const phone = '+919876543210';
      const code = '123456';
      
      mockRedisClient.get.mockResolvedValue(code);
      mockRedisClient.del.mockResolvedValue(1);
      mockDriversRepository.findOne.mockResolvedValue(null);
      
      const newDriver = {
        id: 'new-driver-id',
        phone,
        name: phone,
        vehicleType: 'unknown',
        capacity: 1,
        online: false,
      };
      mockDriversRepository.create.mockReturnValue(newDriver);
      mockDriversRepository.save.mockResolvedValue(newDriver);
      mockJwtService.signAsync.mockResolvedValue('jwt-token-here');

      // Act
      const result = await controller.verify({ phone, code });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.access_token).toBe('jwt-token-here');
      expect(mockDriversRepository.create).toHaveBeenCalledWith({
        phone,
        name: phone,
        vehicleType: 'unknown',
        capacity: 1,
        online: false,
      });
      expect(mockDriversRepository.save).toHaveBeenCalled();
    });

    it('should return error for invalid OTP code', async () => {
      // Arrange
      const phone = '+919999999999';
      const code = 'wrong-code';
      
      mockRedisClient.get.mockResolvedValue('123456'); // Different code in Redis

      // Act
      const result = await controller.verify({ phone, code });

      // Assert
      expect(result.ok).toBe(false);
      expect(result.message).toContain('Invalid OTP code');
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should return error if OTP expired (not found in Redis)', async () => {
      // Arrange
      const phone = '+919999999999';
      const code = '123456';
      
      mockRedisClient.get.mockResolvedValue(null); // OTP expired

      // Act
      const result = await controller.verify({ phone, code });

      // Assert
      expect(result.ok).toBe(false);
      expect(result.message).toContain('Invalid OTP code');
    });

    it('should return error if phone or code is missing', async () => {
      // Act
      const result1 = await controller.verify({ phone: '', code: '123456' });
      const result2 = await controller.verify({ phone: '+919999999999', code: '' });

      // Assert
      expect(result1.ok).toBe(false);
      expect(result2.ok).toBe(false);
      expect(result1.message).toContain('required');
      expect(result2.message).toContain('required');
    });
  });
});


