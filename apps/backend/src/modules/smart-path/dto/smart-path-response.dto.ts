export class SmartPathResponseDto {
  id!: string;
  driverId!: string;
  pickupLocation!: { lat: number; lng: number; address?: string };
  orderIds!: string[];
  routePlanId!: string | null;
  status!: string;
  targetDate!: Date;
  routePlan?: {
    id: string;
    stops: Array<{ lat: number; lng: number; orderId?: string; address?: string }>;
    sequence: number[] | null;
    polyline: string | null;
    totalDistanceKm: number;
    estimatedDurationSec: number | null;
    etaPerStop: string[] | null;
  } | null;
  createdAt!: Date;
  updatedAt!: Date;
}
