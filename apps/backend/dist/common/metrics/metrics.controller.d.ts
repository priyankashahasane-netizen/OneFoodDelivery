import { MetricsService } from './metrics.service.js';
export declare class MetricsController {
    private readonly metrics;
    constructor(metrics: MetricsService);
    get(): {
        [x: string]: number;
    };
}
