import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RestaurantEntity } from './entities/restaurant.entity.js';
import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
import { ListRestaurantsDto } from './dto/list-restaurants.dto.js';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(RestaurantEntity)
    private readonly restaurantRepo: Repository<RestaurantEntity>
  ) {}

  async list(filters: ListRestaurantsDto) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 25;

    const query = this.restaurantRepo
      .createQueryBuilder('restaurant')
      .orderBy('restaurant.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (filters.status) {
      query.andWhere('LOWER(restaurant.status) = LOWER(:status)', {
        status: filters.status
      });
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async create(dto: CreateRestaurantDto) {
    const restaurant = this.restaurantRepo.create({
      ...dto,
      slug: dto.slug ?? this.slugify(dto.name),
      status: dto.status ?? 'active',
      isVerified: dto.isVerified ?? false,
      payoutCycle: dto.payoutCycle ?? 'weekly',
      cuisines: dto.cuisines ?? null,
      dietaryTags: dto.dietaryTags ?? null,
      commissionRate: dto.commissionRate ?? 0,
      minOrderValue: dto.minOrderValue ?? 0,
      maxDeliveryDistanceKm: dto.maxDeliveryDistanceKm ?? null
    });

    return this.restaurantRepo.save(restaurant);
  }

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
}

