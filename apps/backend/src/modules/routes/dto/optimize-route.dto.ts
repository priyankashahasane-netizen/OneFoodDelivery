import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

class OptimizeStopDto {
  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  lng!: number;

  @IsString()
  orderId!: string;
}

export class OptimizeRouteDto {
  @IsString()
  driverId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => OptimizeStopDto)
  @ValidateNested({ each: true })
  stops!: OptimizeStopDto[];
}

