import { Body, Controller, Get, Param, Patch, Post, Query, Request, HttpException, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { DriversService } from './drivers.service.js';
import { UpdateDriverDto } from './dto/update-driver.dto.js';
import { CreateDriverDto } from './dto/create-driver.dto.js';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  async list(@Query() pagination: PaginationQueryDto) {
    return this.driversService.listDrivers(pagination);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'dispatcher')
  async create(@Body() payload: CreateDriverDto) {
    try {
      return await this.driversService.create(payload);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        throw new BadRequestException(error.message);
      }
      throw new HttpException(
        error.message || 'Failed to create driver',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    const driverId = req.user?.sub || req.user?.driverId;
    const isDemoAccount = req.user?.driverId === 'demo-driver-id';
    
    // For demo account, try to find the actual demo driver by phone
    if (isDemoAccount) {
      const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
      
      for (const phone of demoPhones) {
        const demoDriver = await this.driversService.findByPhone(phone);
        if (demoDriver) {
          return this.driversService.getProfile(demoDriver.id);
        }
      }
    }
    
    // Return enriched profile with all fields expected by frontend
    return this.driversService.getProfile(driverId);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.driversService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() payload: UpdateDriverDto, @Request() req: any) {
    // Demo mode: Allow updates without authorization check
    // In production, drivers can only update themselves
    const driverId = req.user?.sub || req.user?.driverId;
    const isDemoAccount = req.user?.phone === '9975008124' || req.user?.phone === '+919975008124' || req.user?.driverId === 'demo-driver-id';
    
    // For demo accounts, find the actual driver by phone to get the correct UUID
    let actualDriverId = id;
    if (isDemoAccount) {
      const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
      
      // Find the actual driver by phone to get the correct UUID
      for (const phone of demoPhones) {
        const demoDriver = await this.driversService.findByPhone(phone);
        if (demoDriver) {
          actualDriverId = demoDriver.id;
          break;
        }
      }
    }
    
    // Skip authorization check for demo account
    if (!isDemoAccount && driverId !== id) {
      throw new Error('Unauthorized');
    }
    
    // Try to update with the actual driver ID
    try {
      return await this.driversService.update(actualDriverId, payload);
    } catch (error: any) {
      // If update fails with 404 and it's a demo account, try finding by phone one more time
      if (isDemoAccount && (error.message?.includes('not found') || error instanceof NotFoundException)) {
        const demoPhones = ['9975008124', '+919975008124', '+91-9975008124', '919975008124'];
        for (const phone of demoPhones) {
          const demoDriver = await this.driversService.findByPhone(phone);
          if (demoDriver) {
            return this.driversService.update(demoDriver.id, payload);
          }
        }
      }
      throw error;
    }
  }

  @Patch(':id/capacity')
  @UseGuards(JwtAuthGuard)
  async updateCapacity(@Param('id') id: string, @Body() body: { capacity: number }, @Request() req: any) {
    const driverId = req.user?.sub || req.user?.driverId;
    const isDemoAccount = req.user?.phone === '9975008124' || req.user?.phone === '+919975008124' || req.user?.driverId === 'demo-driver-id';
    
    // Skip authorization check for demo account
    if (!isDemoAccount && driverId !== id) {
      throw new Error('Unauthorized');
    }
    return this.driversService.update(id, { capacity: body.capacity });
  }

  @Patch(':id/online')
  @UseGuards(JwtAuthGuard)
  async updateOnlineStatus(@Param('id') id: string, @Body() body: { online: boolean }, @Request() req: any) {
    try {
      const driverId = req.user?.sub || req.user?.driverId;
      const isDemoAccount = req.user?.phone === '9975008124' || req.user?.phone === '+919975008124' || req.user?.driverId === 'demo-driver-id';
      
      // Handle numeric ID from frontend - the frontend sends numeric IDs but database uses UUIDs
      // We need to find the actual driver UUID based on the authenticated user
      let actualDriverId: string;
      
      // Check if the ID parameter is a UUID
      const isParamUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      // Check if driverId from token is a UUID
      const isTokenDriverIdUuid = driverId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(driverId) : false;
      
      if (!isParamUuid) {
        // Numeric ID provided - find the actual driver UUID
        // Always lookup by phone since frontend sends numeric IDs
        const phoneToUse = req.user?.phone || (isDemoAccount ? '+919975008124' : null);
        if (phoneToUse) {
          const phoneVariations = [
            phoneToUse,
            phoneToUse.replace('+91', '').replace(/-/g, ''),
            phoneToUse.replace('+', ''),
            `+91${phoneToUse.replace('+91', '').replace(/-/g, '')}`,
            `91${phoneToUse.replace('+91', '').replace(/-/g, '')}`
          ];
          
          let foundDriver = null;
          for (const phone of phoneVariations) {
            foundDriver = await this.driversService.findByPhone(phone);
            if (foundDriver) {
              actualDriverId = foundDriver.id;
              break;
            }
          }
          
          if (!foundDriver) {
            // If phone lookup fails but we have a valid UUID in token, use that
            if (driverId && isTokenDriverIdUuid) {
              actualDriverId = driverId;
            } else {
              throw new NotFoundException(`Driver not found for phone: ${phoneToUse}`);
            }
          }
        } else {
          // No phone available - use driverId from token if it's a valid UUID
          if (driverId && isTokenDriverIdUuid) {
            actualDriverId = driverId;
          } else {
            throw new NotFoundException('Unable to determine driver ID - phone not available');
          }
        }
      } else {
        // UUID provided - use as is
        actualDriverId = id;
      }
      
      // Skip authorization check for demo account
      if (!isDemoAccount && driverId && driverId !== actualDriverId) {
        throw new HttpException('Unauthorized to update this driver', HttpStatus.FORBIDDEN);
      }
      
      // Validate body.online is a boolean
      if (typeof body.online !== 'boolean') {
        throw new BadRequestException('Invalid online status: must be a boolean');
      }
      
      // Check if driver is verified before allowing them to go online
      if (body.online === true) {
        const driver = await this.driversService.findById(actualDriverId);
        if (!driver.isVerified) {
          throw new BadRequestException('You cannot go online. Your account is not verified.');
        }
      }
      
      const updatedDriver = await this.driversService.update(actualDriverId, { online: body.online });
      
      // Return success response with message
      return {
        message: body.online ? 'You are now online' : 'You are now offline',
        online: updatedDriver.online,
        active: updatedDriver.online ? 1 : 0
      };
    } catch (error: any) {
      // Re-throw HttpExceptions (already properly formatted)
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Handle NotFoundException from service
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      // Log the error for debugging
      console.error('Error updating driver online status:', error);
      
      // Return a user-friendly error for unexpected errors
      throw new HttpException(
        `Failed to update online status: ${error.message || 'Internal server error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

