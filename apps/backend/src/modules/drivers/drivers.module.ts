import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DriverEntity } from './entities/driver.entity.js';
import { DriversController } from './drivers.controller.js';
import { DriversService } from './drivers.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([DriverEntity])],
  providers: [DriversService],
  controllers: [DriversController],
  exports: [DriversService]
})
export class DriversModule {}


