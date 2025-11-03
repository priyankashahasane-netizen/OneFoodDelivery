declare class LocationDto {
    lat: number;
    lng: number;
    address: string;
}
declare class OrderItemDto {
    name: string;
    quantity: number;
    price: number;
}
export declare class CreateOrderFromWebhookDto {
    platform: string;
    externalRef: string;
    pickup: LocationDto;
    dropoff: LocationDto;
    items: OrderItemDto[];
    paymentType: 'cash' | 'online';
    customerPhone: string;
    customerName?: string;
    slaMinutes: number;
}
export {};
