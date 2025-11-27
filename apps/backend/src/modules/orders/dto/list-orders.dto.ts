import { Type, Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListOrdersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000) // Allow large pageSize to fetch all orders
  pageSize?: number = 25;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  paymentType?: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Return undefined for empty strings, null, or undefined values
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    // Handle string values from query parameters
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase().trim();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
      // If it's a string but not 'true' or 'false', return undefined
      return undefined;
    }
    // Handle boolean values (shouldn't happen with query params, but just in case)
    if (typeof value === 'boolean') {
      return value;
    }
    return undefined;
  })
  assigned?: boolean; // true for assigned, false for unassigned, undefined for all

  @IsOptional()
  @IsString()
  orderType?: string; // 'regular' or 'subscription'
}

