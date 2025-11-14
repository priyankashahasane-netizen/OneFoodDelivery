import { IsOptional, IsString, IsDateString } from 'class-validator';

export class GenerateSmartPathDto {
  @IsString()
  driverId!: string;

  @IsOptional()
  @IsDateString()
  date?: string; // Optional date in ISO format, defaults to today
}
