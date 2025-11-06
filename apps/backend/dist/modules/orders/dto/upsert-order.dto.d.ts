export declare class CoordinateDto {
    lat: number;
    lng: number;
    address?: string;
}
export declare enum PaymentType {
    Cod = "cash_on_delivery",
    Prepaid = "prepaid",
    Partial = "partial"
}
export declare class UpsertOrderDto {
    externalRef?: string;
    pickup: CoordinateDto;
    dropoff: CoordinateDto;
    paymentType: PaymentType;
    status: string;
    items?: unknown[];
    slaSeconds?: number;
    trackingUrl?: string;
    zoneId?: string;
    subscriptionId?: string;
    cancellationSource?: string;
    cancellationReason?: string;
}
