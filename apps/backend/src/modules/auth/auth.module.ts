import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RedisClientProvider } from '../../common/redis/redis.provider.js';
import { AuthController } from './auth.controller.js';
import { JwtAuthGuard } from './jwt.guard.js';
import { JwtStrategy } from './jwt.strategy.js';
import { RolesGuard } from './roles.guard.js';
import { DriverOtpController } from './driver-auth.controller.js';
import { DriverEntity } from '../drivers/entities/driver.entity.js';
import { MapperEntity } from '../drivers/entities/mapper.entity.js';
import { CustomJwtService } from './jwt.service.js';
import { TokenBlacklistService } from './token-blacklist.service.js';
import { DriversModule } from '../drivers/drivers.module.js';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret',
      signOptions: {
        expiresIn: '30d', // Tokens expire in 30 days
      },
    }),
    TypeOrmModule.forFeature([DriverEntity, MapperEntity]),
    forwardRef(() => DriversModule) // Import DriversModule to use DriversService
  ],
  controllers: [AuthController, DriverOtpController],
  providers: [
    JwtStrategy,
    CustomJwtService,
    TokenBlacklistService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    RedisClientProvider
  ],
  exports: [CustomJwtService, TokenBlacklistService] // Export so other modules can use it
})
export class AuthModule {}


