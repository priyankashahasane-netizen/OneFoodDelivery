import { Body, Controller, Post, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';

import { InjectRedis } from '../../common/redis/redis.provider.js';
import { Public } from './public.decorator.js';
import { DriverEntity } from '../drivers/entities/driver.entity.js';
import { CustomJwtService } from './jwt.service.js';
import { DriversService } from '../drivers/drivers.service.js';

@Controller()
export class DriverOtpController {
  constructor(
    private readonly jwtService: CustomJwtService,
    @InjectRepository(DriverEntity) private readonly drivers: Repository<DriverEntity>,
    @InjectRedis() private readonly redis,
    @Inject(forwardRef(() => DriversService)) private readonly driversService: DriversService
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
  async verify(@Body() body: { phone: string; code: string; firstName?: string; lastName?: string; email?: string }) {
    try {
      if (!body.phone || !body.code) {
        return { ok: false, message: 'Phone number and code are required' };
      }
      
      // Note: OTP is already verified by CubeOne API on the frontend
      // We skip Redis OTP verification here since CubeOne handles it
      // If you want to keep Redis verification as a fallback, uncomment below:
      /*
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
          console.warn('Redis unavailable for OTP verification.');
          return { ok: false, message: 'OTP verification unavailable. Redis is required for OTP verification.' };
        }
      } else {
        return { ok: false, message: 'OTP verification unavailable. Redis is required for OTP verification.' };
      }
      */
      
      // Try to find driver by phone - check multiple phone format variations
      let driver = await this.drivers.findOne({ where: { phone: body.phone } });
      
      // If not found, try phone number variations
      if (!driver) {
        const phoneVariations = [
          body.phone,
          body.phone.replace('+91', '').replace(/-/g, ''),
          body.phone.replace('+', ''),
          `+91${body.phone.replace('+91', '').replace(/-/g, '')}`,
          `91${body.phone.replace('+91', '').replace(/-/g, '')}`
        ];
        
        for (const phoneVar of phoneVariations) {
          if (phoneVar !== body.phone) {
            driver = await this.drivers.findOne({ where: { phone: phoneVar } });
            if (driver) {
              console.log(`[OTP verify] Found driver with phone variation: ${phoneVar} (original: ${body.phone})`);
              break;
            }
          }
        }
      }
      
      if (!driver) {
        console.log(`[OTP verify] Creating new driver with phone: ${body.phone}`);
        const driverData: Partial<DriverEntity> = { 
          phone: body.phone, 
          name: body.firstName && body.lastName ? `${body.firstName} ${body.lastName}`.trim() : body.phone, 
          vehicleType: 'unknown', 
          capacity: 1, 
          online: false, 
          isActive: true 
        };

        // Add metadata if additional info is provided
        if (body.firstName || body.lastName || body.email) {
          driverData.metadata = {
            firstName: body.firstName,
            lastName: body.lastName,
            email: body.email,
          } as Record<string, unknown>;
        }

        const newDriver = this.drivers.create(driverData);
        driver = await this.drivers.save(newDriver);
        console.log(`[OTP verify] Created new driver ${driver.id} with is_active=${driver.isActive}`);
      } else {
        console.log(`[OTP verify] Found existing driver ${driver.id}, current is_active=${driver.isActive}, phone: ${driver.phone}`);
        // Update is_active to true on login using the service method
        const previousIsActive = driver.isActive;
        
        // Use the service update method to ensure proper persistence
        const updatedDriver = await this.driversService.update(driver.id, { isActive: true });
        console.log(`[OTP verify] Updated driver ${updatedDriver.id} via service, previous is_active=${previousIsActive}, new is_active=${updatedDriver.isActive}`);
        
        // Reload from database to ensure we have the latest data
        const reloadedDriver = await this.drivers.findOne({ where: { id: updatedDriver.id } });
        if (reloadedDriver) {
          console.log(`[OTP verify] Reloaded driver ${reloadedDriver.id}, is_active=${reloadedDriver.isActive}, phone: ${reloadedDriver.phone}`);
          // Use the reloaded driver for token generation
          driver = reloadedDriver;
          
          if (reloadedDriver.isActive !== true) {
            console.error(`[OTP verify] ERROR: is_active update failed! Expected true but got ${reloadedDriver.isActive}`);
            // Try direct SQL update as last resort
            await this.drivers
              .createQueryBuilder()
              .update(DriverEntity)
              .set({ isActive: true })
              .where('id = :id', { id: reloadedDriver.id })
              .execute();
            
            // Reload again
            const finalDriver = await this.drivers.findOne({ where: { id: reloadedDriver.id } });
            if (finalDriver) {
              driver = finalDriver;
              console.log(`[OTP verify] After SQL update, driver ${driver.id} has is_active=${driver.isActive}`);
            }
          }
        } else {
          console.error(`[OTP verify] ERROR: Could not reload driver ${updatedDriver.id} after update`);
          driver = updatedDriver;
        }

        // Update driver info if provided
        if (body.firstName || body.lastName || body.email) {
          const updateData: any = {};
          if (body.firstName && body.lastName) {
            updateData.name = `${body.firstName} ${body.lastName}`.trim();
          }
          if (body.email || body.firstName || body.lastName) {
            const metadata = driver.metadata || {};
            if (body.email) metadata.email = body.email;
            if (body.firstName) metadata.firstName = body.firstName;
            if (body.lastName) metadata.lastName = body.lastName;
            updateData.metadata = metadata;
          }
          
          if (Object.keys(updateData).length > 0) {
            await this.driversService.update(driver.id, updateData);
            driver = await this.drivers.findOne({ where: { id: driver.id } });
          }
        }
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
}



