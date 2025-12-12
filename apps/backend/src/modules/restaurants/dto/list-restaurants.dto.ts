import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export class ListRestaurantsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;
}

