import { Body, Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';

import { InjectRedis } from '../../common/redis/redis.provider.js';
import { Public } from './public.decorator.js';
import { DriverEntity } from '../drivers/entities/driver.entity.js';
import { CustomJwtService } from './jwt.service.js';

@Controller()
export class DriverOtpController {
  constructor(
    private readonly jwtService: CustomJwtService,
    @InjectRepository(DriverEntity) private readonly drivers: Repository<DriverEntity>,
    @InjectRedis() private readonly redis
  ) {}

  @Public()
  @Post('auth/driver/otp/request')
  async request(@Body() body: { phone: string }) {
    try {
      if (!body.phone) {
        return { ok: false, message: 'Phone number is required' };
      }
      const code = (randomInt(0, 999999) + '').padStart(6, '0');
      const key = `otp:driver:${body.phone}`;
      
      // Try to store OTP in Redis if available
      if (this.isRedisAvailable()) {
        try {
          await this.redis.set(key, code, 'EX', 300);
        } catch (redisError) {
          // Redis unavailable - in production you might want to fail here
          // For now, we'll allow OTP without Redis (development mode)
          console.warn('Redis unavailable for OTP storage. OTP functionality may be limited.');
          // Continue without Redis storage
        }
      } else {
        console.warn('Redis not available for OTP storage. OTP functionality may be limited.');
      }
      
      // In production, send via SMS provider; for now, return masked
      // For development, log the OTP code
      console.log(`[DEV] OTP for ${body.phone}: ${code}`);
      return { ok: true };
    } catch (error) {
      console.error('OTP request error:', error);
      // Return a proper error response instead of throwing
      return { ok: false, message: 'Failed to send OTP', error: error.message };
    }
  }

  @Public()
  @Post('auth/driver/otp/verify')
  async verify(@Body() body: { phone: string; code: string }) {
    try {
      if (!body.phone || !body.code) {
        return { ok: false, message: 'Phone number and code are required' };
      }
      
      // Verify OTP from Redis if available
      if (this.isRedisAvailable()) {
        try {
          const key = `otp:driver:${body.phone}`;
          const stored = await this.redis.get(key);
          if (!stored || stored !== body.code) {
            return { ok: false, message: 'Invalid OTP code' };
          }
          await this.redis.del(key);
        } catch (redisError) {
          // Redis unavailable - in production you might want to fail here
          // For development, we'll allow login without OTP verification
          console.warn('Redis unavailable for OTP verification. Skipping OTP check (development mode).');
          return { ok: false, message: 'OTP verification unavailable. Redis is required for OTP verification.' };
        }
      } else {
        // Redis not available - cannot verify OTP
        return { ok: false, message: 'OTP verification unavailable. Redis is required for OTP verification.' };
      }
      
      let driver = await this.drivers.findOne({ where: { phone: body.phone } });
      if (!driver) {
        driver = this.drivers.create({ phone: body.phone, name: body.phone, vehicleType: 'unknown', capacity: 1, online: false });
        driver = await this.drivers.save(driver);
      }
      const tokenResponse = await this.jwtService.generateDriverToken(driver.id, driver.phone);
      return { 
        ok: true, 
        access_token: tokenResponse.access_token, 
        token: tokenResponse.token, 
        driverId: driver.id,
        expiresIn: tokenResponse.expiresIn,
        expiresAt: tokenResponse.expiresAt
      };
    } catch (error) {
      console.error('OTP verify error:', error);
      // Return a proper error response instead of throwing
      return { ok: false, message: 'Failed to verify OTP', error: error.message };
    }
  }
  
  private isRedisAvailable(): boolean {
    return this.redis && (this.redis.status === 'ready' || this.redis.status === 'connecting');
  }

  // Legacy password-based login endpoint for backward compatibility
  @Public()
  @Post('v1/auth/delivery-man/login')
  async legacyLogin(@Body() body: { phone: string; password: string }) {
    try {
      if (!body.phone || !body.password) {
        return { ok: false, message: 'Phone number and password are required' };
      }

      // Find driver by phone
      let driver = await this.drivers.findOne({ where: { phone: body.phone } });

      // For development: if driver doesn't exist, create one with default password
      // In production, you should require registration or proper password setup
      if (!driver) {
        // Create new driver with default password stored in metadata
        const hashedPassword = await bcrypt.hash('123456', 10); // Default password
        driver = this.drivers.create({
          phone: body.phone,
          name: body.phone,
          vehicleType: 'unknown',
          capacity: 1,
          online: false,
          metadata: { password: hashedPassword }
        });
        driver = await this.drivers.save(driver);
      }

      // Check password from metadata or use default for development
      const storedPassword = driver.metadata?.password;
      let isValidPassword = false;

      if (storedPassword) {
        isValidPassword = await bcrypt.compare(body.password, storedPassword as string);
      } else {
        // For development: accept default password "123456" for existing drivers without password
        isValidPassword = body.password === '123456';
        // If password matches, hash and store it
        if (isValidPassword) {
          const hashedPassword = await bcrypt.hash(body.password, 10);
          driver.metadata = { ...driver.metadata, password: hashedPassword };
          await this.drivers.save(driver);
        }
      }

      if (!isValidPassword) {
        return { ok: false, message: 'Invalid phone number or password' };
      }

      // Generate JWT token using the new service
      const tokenResponse = await this.jwtService.generateDriverToken(driver.id, driver.phone);

      // Return response in legacy format
      return {
        ok: true,
        token: tokenResponse.token,
        access_token: tokenResponse.access_token,
        expiresIn: tokenResponse.expiresIn,
        expiresAt: tokenResponse.expiresAt,
        delivery_man: {
          id: driver.id,
          phone: driver.phone,
          name: driver.name
        }
      };
    } catch (error) {
      console.error('Legacy login error:', error);
      return { ok: false, message: 'Login failed', error: error.message };
    }
  }
}



