import { Type } from 'class-transformer';
import { IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';

export class TrackPointDto {
  @IsString()
  driverId!: string;

  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  lng!: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  speed?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsISO8601()
  ts?: string;
}


