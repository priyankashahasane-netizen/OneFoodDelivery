import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsString()
  vehicleType!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  capacity?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  homeAddress?: string;

  @IsOptional()
  @IsNumber()
  homeAddressLatitude?: number;

  @IsOptional()
  @IsNumber()
  homeAddressLongitude?: number;

  @IsOptional()
  @IsString()
  zoneId?: string;
}

