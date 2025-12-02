import { Body, Controller, Post, Inject, forwardRef, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import axios from 'axios';

import { InjectRedis } from '../../common/redis/redis.provider.js';
import { Public } from './public.decorator.js';
import { JwtAuthGuard } from './jwt.guard.js';
import { DriverEntity } from '../drivers/entities/driver.entity.js';
import { MapperEntity } from '../drivers/entities/mapper.entity.js';
import { CustomJwtService, TokenPayload } from './jwt.service.js';
import { DriversService } from '../drivers/drivers.service.js';

@Controller()
export class DriverOtpController {
  constructor(
    private readonly jwtService: CustomJwtService,
    @InjectRepository(DriverEntity) private readonly drivers: Repository<DriverEntity>,
    @InjectRepository(MapperEntity) private readonly mapperRepository: Repository<MapperEntity>,
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
          isActive: true,
          isVerified: false
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
  
  @Public()
  @Post('v2/hybrid-auth/login')
  async hybridAuthLogin(@Body() body: { 
    phone: string;
    otp: string;
    access_token?: string; // Optional: if frontend already has it from verify-mobile-otp
  }) {
    try {
      if (!body.phone || !body.otp) {
        return { ok: false, message: 'Phone number and OTP are required' };
      }

      let cubeOneAccessToken: string | null = null;
      let userId: string | null = null;

      // If access_token is provided, use it directly
      if (body.access_token) {
        cubeOneAccessToken = body.access_token;
        console.log(`[hybrid-auth/login] Using provided access_token`);
      } else {
        // Otherwise, call CubeOne login API to get access_token
        console.log(`[hybrid-auth/login] Calling CubeOne login API for phone: ${body.phone}`);
        
        try {
          // Format phone for CubeOne (91<mobile>)
          const formattedPhone = body.phone.startsWith('+91') 
            ? body.phone.substring(1) 
            : body.phone.startsWith('91') 
            ? body.phone 
            : `91${body.phone}`;

          const cubeOneBaseUrl = process.env.CUBEONE_BASE_URL || 'https://api.cubeone.app';
          const cubeOneLoginUri = process.env.CUBEONE_LOGIN_URI || '/v2/hybrid-auth/login';
          
          const cubeOneResponse = await axios.post(
            `${cubeOneBaseUrl}${cubeOneLoginUri}`,
            {
              username: formattedPhone,
              login_otp: body.otp,
            },
            {
              headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
              },
              timeout: 30000,
            }
          );

          if (cubeOneResponse.data?.success === true && cubeOneResponse.data?.data) {
            const data = cubeOneResponse.data.data;
            cubeOneAccessToken = data.token || data.access_token || data.accessToken || data.auth_token || data.authToken;
            console.log(`[hybrid-auth/login] Received access_token from CubeOne`);
          } else {
            return { ok: false, message: cubeOneResponse.data?.message || 'CubeOne login failed' };
          }
        } catch (cubeOneError: any) {
          console.error(`[hybrid-auth/login] CubeOne login error:`, cubeOneError);
          return { 
            ok: false, 
            message: cubeOneError.response?.data?.message || 'Failed to login with CubeOne' 
          };
        }
      }

      if (!cubeOneAccessToken) {
        return { ok: false, message: 'Failed to obtain access_token from CubeOne' };
      }

      // Decode the JWT token to get the "sub" field (userId) and "old_sso_user_id"
      // Try to verify with our JWT service first
      let decodedToken: TokenPayload | null = await this.jwtService.verifyToken(cubeOneAccessToken);
      
      userId = null;
      let oldSsoUserId: string | null = null;
      
      if (!decodedToken || !decodedToken.sub) {
        // If our JWT service can't verify it (different secret), try to decode without verification
        try {
          const tokenPayload = this.decodeJwtPayload(cubeOneAccessToken);
          if (tokenPayload) {
            userId = tokenPayload.sub || null;
            oldSsoUserId = tokenPayload.old_sso_user_id || null;
            console.log(`[hybrid-auth/login] Decoded userId from token (without verification): ${userId}, old_sso_user_id: ${oldSsoUserId}`);
          }
        } catch (decodeError) {
          console.error(`[hybrid-auth/login] Failed to decode token:`, decodeError);
          return { ok: false, message: 'Invalid access_token or missing sub field' };
        }
      } else {
        userId = decodedToken.sub;
        // For our own tokens, old_sso_user_id might not be present, but try to decode anyway
        const tokenPayload = this.decodeJwtPayload(cubeOneAccessToken);
        oldSsoUserId = tokenPayload?.old_sso_user_id || null;
        console.log(`[hybrid-auth/login] Decoded userId from token: ${userId}, old_sso_user_id: ${oldSsoUserId}`);
      }

      if (!userId) {
        return { ok: false, message: 'Could not extract userId from access_token' };
      }

      // Call newDriverFunc to create a blank driver
      console.log(`[hybrid-auth/login] Creating driver using newDriverFunc for phone: ${body.phone}`);
      const driverResult = await this.driversService.newDriverFunc(body.phone);
      
      const driverId = driverResult.driver.id;
      console.log(`[hybrid-auth/login] Created driver with ID: ${driverId}`);

      // Create mapper entry: store userId (sub from token), old_sso_user_id, and driverId
      try {
        // Check if mapper entry already exists
        const existingMapper = await this.mapperRepository.findOne({
          where: {
            driverId: driverId,
            userId: userId
          }
        });

        if (!existingMapper) {
          const mapper = this.mapperRepository.create({
            driverId: driverId,
            userId: userId,
            oldSsoUserId: oldSsoUserId
          });
          await this.mapperRepository.save(mapper);
          console.log(`[hybrid-auth/login] Created mapper entry: driverId=${driverId}, userId=${userId}, oldSsoUserId=${oldSsoUserId}`);
        } else {
          // Update existing mapper with old_sso_user_id if it's not set
          if (!existingMapper.oldSsoUserId && oldSsoUserId) {
            existingMapper.oldSsoUserId = oldSsoUserId;
            await this.mapperRepository.save(existingMapper);
            console.log(`[hybrid-auth/login] Updated mapper entry with oldSsoUserId: ${oldSsoUserId}`);
          } else {
            console.log(`[hybrid-auth/login] Mapper entry already exists: driverId=${driverId}, userId=${userId}`);
          }
        }
      } catch (mapperError) {
        console.error(`[hybrid-auth/login] Error creating mapper entry:`, mapperError);
        // Continue even if mapper creation fails - don't fail the whole request
      }

      // Generate our own JWT token for the driver (for login)
      const tokenResponse = await this.jwtService.generateDriverToken(driverId, body.phone);
      
      return {
        ok: true,
        access_token: tokenResponse.access_token,
        token: tokenResponse.token,
        driverId: driverId,
        expiresIn: tokenResponse.expiresIn,
        expiresAt: tokenResponse.expiresAt
      };
    } catch (error) {
      console.error('[hybrid-auth/login] Error:', error);
      return { 
        ok: false, 
        message: 'Failed to login', 
        error: error.message 
      };
    }
  }

  @Public()
  @Post('v2/hybrid-auth/refresh-token')
  async refreshToken(@Body() body: { 
    refresh_token: string;
  }) {
    try {
      if (!body.refresh_token) {
        return { ok: false, message: 'refresh_token is required' };
      }

      // Call CubeOne refresh token API
      const cubeOneRefreshUrl = process.env.CUBEONE_REFRESH_URL || 'https://apigw.cubeone.in/v2/hybrid-auth/refresh-token';
      
      console.log(`[refresh-token] Calling CubeOne refresh token API`);
      
      try {
        const cubeOneResponse = await axios.post(
          cubeOneRefreshUrl,
          {
            refresh_token: body.refresh_token,
          },
          {
            headers: {
              'accept': 'application/json',
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        // Check if the response is successful
        if (cubeOneResponse.data?.success === true && cubeOneResponse.data?.data) {
          const data = cubeOneResponse.data.data;
          const newAccessToken = data.token || data.access_token || data.accessToken || data.auth_token || data.authToken;
          const newRefreshToken = data.refresh_token || data.refreshToken || body.refresh_token; // Fallback to old refresh token if not provided
          
          console.log(`[refresh-token] Successfully refreshed token from CubeOne`);
          
          // Decode the new access token to get userId
          const tokenPayload = this.decodeJwtPayload(newAccessToken);
          const userId = tokenPayload?.sub || null;
          
          if (!userId) {
            console.warn(`[refresh-token] Could not extract userId from new access token`);
            // Still return the tokens even if we can't extract userId
            return {
              ok: true,
              access_token: newAccessToken,
              token: newAccessToken,
              refresh_token: newRefreshToken,
              data: cubeOneResponse.data.data
            };
          }

          // Find the mapper entry to get the driverId
          const mapper = await this.mapperRepository.findOne({
            where: { userId: userId }
          });

          if (mapper) {
            // Get driver info to generate our own token
            const driver = await this.drivers.findOne({ where: { id: mapper.driverId } });
            
            if (driver) {
              // Generate our own JWT token for the driver
              const tokenResponse = await this.jwtService.generateDriverToken(driver.id, driver.phone);
              
              return {
                ok: true,
                access_token: tokenResponse.access_token,
                token: tokenResponse.token,
                refresh_token: newRefreshToken,
                driverId: driver.id,
                expiresIn: tokenResponse.expiresIn,
                expiresAt: tokenResponse.expiresAt,
                cubeOneAccessToken: newAccessToken // Also return CubeOne token for reference
              };
            }
          }

          // If no mapper found, still return the CubeOne tokens
          return {
            ok: true,
            access_token: newAccessToken,
            token: newAccessToken,
            refresh_token: newRefreshToken,
            data: cubeOneResponse.data.data
          };
        } else {
          return { 
            ok: false, 
            message: cubeOneResponse.data?.message || 'CubeOne refresh token failed',
            data: cubeOneResponse.data 
          };
        }
      } catch (cubeOneError: any) {
        console.error(`[refresh-token] CubeOne refresh token error:`, cubeOneError);
        return { 
          ok: false, 
          message: cubeOneError.response?.data?.message || 'Failed to refresh token with CubeOne',
          error: cubeOneError.message
        };
      }
    } catch (error) {
      console.error('[refresh-token] Error:', error);
      return { 
        ok: false, 
        message: 'Failed to refresh token', 
        error: error.message 
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('v2/hybrid-auth/verify-mapper')
  async verifyMapper(@Request() req: any, @Body() body: { 
    access_token: string; // CubeOne access_token
  }) {
    try {
      if (!body.access_token) {
        return { ok: false, message: 'access_token is required' };
      }

      // Get driverId from our JWT token
      const driverId = req.user?.sub || req.user?.driverId;
      if (!driverId) {
        return { ok: false, message: 'Driver ID not found in token' };
      }

      // Decode CubeOne token to get userId (sub)
      let userId: string | null = null;
      try {
        userId = this.decodeJwtWithoutVerification(body.access_token);
        if (!userId) {
          return { ok: false, message: 'Could not extract userId from access_token' };
        }
      } catch (error) {
        console.error('[verify-mapper] Failed to decode token:', error);
        return { ok: false, message: 'Invalid access_token' };
      }

      // Verify mapper entry exists with matching driverId and userId
      const mapper = await this.mapperRepository.findOne({
        where: { 
          driverId: driverId,
          userId: userId
        }
      });

      if (!mapper) {
        return { 
          ok: false, 
          message: 'Mapper entry not found. Driver ID and User ID do not match.',
          driverId: driverId,
          userId: userId
        };
      }

      return {
        ok: true,
        message: 'Mapper entry verified successfully',
        driverId: mapper.driverId,
        userId: mapper.userId
      };
    } catch (error) {
      console.error('[verify-mapper] Error:', error);
      return { 
        ok: false, 
        message: 'Failed to verify mapper', 
        error: error.message 
      };
    }
  }

  /**
   * Decode JWT token without verification (for tokens with different secrets)
   * Extracts the payload and returns the 'sub' field
   */
  private decodeJwtWithoutVerification(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        return null;
      }

      // Decode the payload (second part)
      let payload = parts[1];
      
      // Add padding if needed for base64 decoding
      while (payload.length % 4 !== 0) {
        payload += '=';
      }

      // Decode base64
      const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8');
      const payloadJson = JSON.parse(decodedPayload);

      // Extract 'sub' field which contains the userId
      return payloadJson.sub || null;
    } catch (error) {
      console.error('[decodeJwtWithoutVerification] Error:', error);
      return null;
    }
  }

  /**
   * Decode JWT token without verification and return full payload
   * Used to extract additional fields like old_sso_user_id
   */
  private decodeJwtPayload(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        return null;
      }

      // Decode the payload (second part)
      let payload = parts[1];
      
      // Add padding if needed for base64 decoding
      while (payload.length % 4 !== 0) {
        payload += '=';
      }

      // Decode base64
      const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8');
      const payloadJson = JSON.parse(decodedPayload);

      return payloadJson;
    } catch (error) {
      console.error('[decodeJwtPayload] Error:', error);
      return null;
    }
  }
  
  private isRedisAvailable(): boolean {
    return this.redis && (this.redis.status === 'ready' || this.redis.status === 'connecting');
  }
}



