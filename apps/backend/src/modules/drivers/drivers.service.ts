import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { UpdateDriverDto } from './dto/update-driver.dto.js';
import { DriverEntity } from './entities/driver.entity.js';
import { DriverProfileResponseDto } from './dto/driver-profile-response.dto.js';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(DriverEntity)
    private readonly driversRepository: Repository<DriverEntity>
  ) {}

  async listDrivers(pagination: PaginationQueryDto) {
    const { page = 1, pageSize = 25 } = pagination;
    const [items, total] = await this.driversRepository.findAndCount({
      take: pageSize,
      skip: (page - 1) * pageSize,
      order: { updatedAt: 'DESC' }
    });
    return { items, total, page, pageSize };
  }

  async findById(driverId: string) {
    const driver = await this.driversRepository.findOne({ where: { id: driverId } });
    if (!driver) {
      throw new NotFoundException(`Driver ${driverId} not found`);
    }
    return driver;
  }

  async findByPhone(phone: string) {
    return await this.driversRepository.findOne({ where: { phone } });
  }

  /**
   * Get enriched profile data with all fields expected by frontend
   * Includes mock values for fields not in database
   */
  async getProfile(driverId: string): Promise<DriverProfileResponseDto> {
    const driver = await this.findById(driverId);
    return DriverProfileResponseDto.fromDriverEntity(driver);
  }

  async update(driverId: string, payload: UpdateDriverDto) {
    const driver = await this.findById(driverId);
    Object.assign(driver, payload);
    return this.driversRepository.save(driver);
  }

  async updatePresence(driverId: string, latitude: number, longitude: number) {
    const driver = await this.findById(driverId);
    driver.latitude = latitude;
    driver.longitude = longitude;
    driver.lastSeenAt = new Date();
    return this.driversRepository.save(driver);
  }
}


