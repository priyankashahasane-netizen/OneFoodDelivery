import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
import { ListRestaurantsDto } from './dto/list-restaurants.dto.js';
import { RestaurantsService } from './restaurants.service.js';

@Controller('restaurants')
@UseGuards(JwtAuthGuard)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @Roles('admin', 'dispatcher', 'support')
  async list(@Query() filters: ListRestaurantsDto) {
    return this.restaurantsService.list(filters);
  }

  @Post()
  @Roles('admin', 'dispatcher', 'support')
  async create(@Body() payload: CreateRestaurantDto) {
    return this.restaurantsService.create(payload);
  }
}

