declare class OptimizeStopDto {
    lat: number;
    lng: number;
    orderId: string;
}
export declare class OptimizeRouteDto {
    driverId: string;
    stops: OptimizeStopDto[];
}
export {};
