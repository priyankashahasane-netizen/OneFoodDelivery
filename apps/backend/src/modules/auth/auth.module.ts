import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret',
      signOptions: {
        expiresIn: '30d', // Tokens expire in 30 days
      },
    }),
    TypeOrmModule.forFeature([DriverEntity])
  ],
  controllers: [AuthController, DriverOtpController],
  providers: [JwtStrategy, { provide: APP_GUARD, useClass: JwtAuthGuard }, { provide: APP_GUARD, useClass: RolesGuard }, RedisClientProvider]
})
export class AuthModule {}


