import { IsString, IsNumber, IsArray, IsEnum, IsObject, ValidateNested, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsString()
  address: string;
}

class OrderItemDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateOrderFromWebhookDto {
  @IsString()
  platform: string;

  @IsString()
  externalRef: string;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  pickup: LocationDto;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  dropoff: LocationDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsEnum(['cash', 'online'])
  paymentType: 'cash' | 'online';

  @IsString()
  customerPhone: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsNumber()
  @Min(1)
  slaMinutes: number;
}
