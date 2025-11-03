export declare class MetricsService {
    private counters;
    inc(key: string, by?: number): void;
    getAll(): {
        [x: string]: number;
    };
}
