import { IsString } from 'class-validator';

export class AssignOrderDto {
  @IsString()
  orderId!: string;

  @IsString()
  driverId!: string;
}


