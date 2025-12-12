import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength
} from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsString()
  @MaxLength(20)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string | null;

  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  city?: string | null;

  @IsOptional()
  @IsString()
  state?: string | null;

  @IsOptional()
  @IsString()
  country?: string | null;

  @IsOptional()
  @IsString()
  postalCode?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number | null;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsString()
  payoutCycle?: string;

  @IsOptional()
  @IsString()
  zoneId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  commissionRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minOrderValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxDeliveryDistanceKm?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cuisines?: string[] | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryTags?: string[] | null;

  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  bannerUrl?: string | null;
}

