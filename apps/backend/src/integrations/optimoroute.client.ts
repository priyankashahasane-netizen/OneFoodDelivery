import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface OptimizeRoutePayload {
  driverId: string;
  stops: Array<{ lat: number; lng: number; orderId?: string }>;
}

@Injectable()
export class OptimoRouteClient {
  private readonly logger = new Logger(OptimoRouteClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('optimoRoute.baseUrl', { infer: true })!;
    this.apiKey = this.configService.get<string>('optimoRoute.apiKey', { infer: true })!;
  }

  async optimizeRoute(payload: OptimizeRoutePayload) {
    // Use mock response if API key is not configured (for testing)
    if (!this.apiKey || this.apiKey === 'your_optimoroute_key_here') {
      this.logger.warn('OptimoRoute API key not configured, using mock response');
      return this.getMockResponse(payload);
    }

    const url = `${this.baseUrl}/optimize`;
    try {
      const response = await axios.post(url, payload, { headers: { 'X-API-Key': this.apiKey } });
      return response.data;
    } catch (error) {
      this.logger.error(`OptimoRoute optimize failed for driver ${payload.driverId}, falling back to mock`, error as Error);
      // Fallback to mock response on error
      return this.getMockResponse(payload);
    }
  }

  /**
   * Generate mock optimization response for testing
   */
  private getMockResponse(payload: OptimizeRoutePayload) {
    const { stops } = payload;

    // Calculate total distance (simplified)
    let totalDistance = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      const lat1 = stops[i].lat;
      const lng1 = stops[i].lng;
      const lat2 = stops[i + 1].lat;
      const lng2 = stops[i + 1].lng;

      // Simple distance calculation (Haversine would be more accurate)
      const distance = Math.sqrt(
        Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)
      ) * 111; // Rough km conversion

      totalDistance += distance;
    }

    // Generate sequence (for mock, just return original order)
    const sequence = stops.map((_, index) => index);

    // Generate ETAs (assuming 30 km/h average speed + 5 min per stop)
    const etaPerStop = stops.map((_, index) => {
      const distanceToStop = totalDistance * (index + 1) / stops.length;
      const travelTime = (distanceToStop / 30) * 60; // minutes
      const stopTime = (index + 1) * 5; // 5 min per stop
      return Math.round(travelTime + stopTime) * 60; // convert to seconds
    });

    // Generate polyline (mock - just coordinates)
    const polyline = stops.map(s => `${s.lat},${s.lng}`).join(';');

    return {
      success: true,
      sequence,
      polyline,
      etaPerStop,
      distanceKm: parseFloat(totalDistance.toFixed(2)),
      estimatedDuration: etaPerStop[etaPerStop.length - 1],
      mock: true,
      algorithm: 'simple-mock',
    };
  }
}


