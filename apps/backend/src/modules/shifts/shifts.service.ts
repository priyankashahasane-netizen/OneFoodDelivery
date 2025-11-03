import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftEntity } from './entities/shift.entity.js';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(ShiftEntity)
    private readonly shiftRepository: Repository<ShiftEntity>
  ) {}

  async findAll(): Promise<ShiftEntity[]> {
    return await this.shiftRepository.find({
      where: { status: 1 },
      order: { startTime: 'ASC' }
    });
  }

  async findByDriverId(driverId: string): Promise<ShiftEntity[]> {
    return await this.shiftRepository.find({
      where: { driverId, status: 1 },
      order: { startTime: 'ASC' }
    });
  }

  async findByZoneId(zoneId: string): Promise<ShiftEntity[]> {
    return await this.shiftRepository.find({
      where: { zoneId, status: 1 },
      order: { startTime: 'ASC' }
    });
  }

  async findById(id: string): Promise<ShiftEntity> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }
    return shift;
  }

  async create(shiftData: Partial<ShiftEntity>): Promise<ShiftEntity> {
    const shift = this.shiftRepository.create(shiftData);
    return await this.shiftRepository.save(shift);
  }

  async update(id: string, shiftData: Partial<ShiftEntity>): Promise<ShiftEntity> {
    const shift = await this.findById(id);
    Object.assign(shift, shiftData);
    return await this.shiftRepository.save(shift);
  }

  async delete(id: string): Promise<void> {
    const shift = await this.findById(id);
    shift.status = 0; // Soft delete
    await this.shiftRepository.save(shift);
  }
}

