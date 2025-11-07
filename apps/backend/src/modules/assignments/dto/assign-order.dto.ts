import { IsOptional, IsString } from 'class-validator';

export class AssignOrderDto {
  @IsString()
  orderId!: string;

  @IsOptional()
  @IsString()
  driverId?: string;
}


