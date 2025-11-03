import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private counters: Record<string, number> = {};

  inc(key: string, by = 1) {
    this.counters[key] = (this.counters[key] ?? 0) + by;
  }

  getAll() {
    return { ...this.counters };
  }
}



