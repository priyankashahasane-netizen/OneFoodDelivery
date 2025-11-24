import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CoordinateDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsOptional()
  @IsString()
  address?: string;
}

export enum PaymentType {
  Cod = 'cash_on_delivery',
  Prepaid = 'prepaid',
  Partial = 'partial'
}

export enum OrderType {
  Regular = 'regular',
  Subscription = 'subscription'
}

export class UpsertOrderDto {
  @IsOptional()
  @IsString()
  externalRef?: string;

  @Type(() => CoordinateDto)
  @ValidateNested()
  pickup!: CoordinateDto;

  @Type(() => CoordinateDto)
  @ValidateNested()
  dropoff!: CoordinateDto;

  @IsEnum(PaymentType)
  paymentType!: PaymentType;

  @IsString()
  status!: string;

  @IsArray()
  @IsOptional()
  items?: unknown[];

  @IsOptional()
  slaSeconds?: number;

  @IsOptional()
  trackingUrl?: string;

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @IsOptional()
  @IsString()
  cancellationSource?: string;

  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;
}


