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

    // OptimoRoute API uses /plan endpoint with Bearer token authentication
    const url = `${this.baseUrl}/plan`;
    
    // Transform stops to OptimoRoute format
    const locations = payload.stops.map((stop, index) => ({
      id: stop.orderId || `stop_${index}`,
      lat: stop.lat,
      lon: stop.lng,
    }));

    const requestPayload = {
      locations,
      // Add other required OptimoRoute parameters if needed
    };

    try {
      this.logger.log(`Calling OptimoRoute API: ${url} with ${locations.length} locations`);
      const response = await axios.post(url, requestPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 30000, // 30 second timeout
      });
      
      this.logger.log(`OptimoRoute API response received successfully`);
      
      // Transform OptimoRoute response to our format
      return this.transformOptimoRouteResponse(response.data, payload.stops);
    } catch (error: any) {
      // If 404, try the /optimize endpoint as fallback (legacy or different API version)
      if (error.response?.status === 404 && url.includes('/plan')) {
        this.logger.warn(`/plan endpoint not found (404), trying /optimize endpoint as fallback`);
        const fallbackUrl = `${this.baseUrl}/optimize`;
        
        try {
          this.logger.log(`Calling OptimoRoute API (fallback): ${fallbackUrl} with ${locations.length} locations`);
          const fallbackResponse = await axios.post(fallbackUrl, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': this.apiKey, // Some versions use X-API-Key instead of Bearer
            },
            timeout: 30000,
          });
          
          this.logger.log(`OptimoRoute API response received successfully from /optimize endpoint`);
          return this.transformOptimoRouteResponse(fallbackResponse.data, payload.stops);
        } catch (retryError: any) {
          // Log the retry error
          if (retryError.response) {
            this.logger.error(
              `OptimoRoute API error (fallback): ${retryError.response.status} ${retryError.response.statusText}`,
              JSON.stringify(retryError.response.data)
            );
          } else {
            this.logger.error(`OptimoRoute API fallback request failed: ${retryError.message}`);
          }
          // Fall through to final error handling
        }
      }
      
      // Log detailed error information
      if (error.response) {
        this.logger.error(
          `OptimoRoute API error: ${error.response.status} ${error.response.statusText}`,
          JSON.stringify(error.response.data)
        );
      } else if (error.request) {
        this.logger.error(`OptimoRoute API request failed: No response received`, error.message);
      } else {
        this.logger.error(`OptimoRoute API error: ${error.message}`);
      }
      
      // Fallback to mock response on error
      this.logger.warn(`Falling back to mock response for driver ${payload.driverId}`);
      return this.getMockResponse(payload);
    }
  }

  /**
   * Transform OptimoRoute API response to our internal format
   */
  private transformOptimoRouteResponse(apiResponse: any, originalStops: Array<{ lat: number; lng: number; orderId?: string }>) {
    // OptimoRoute response format may vary, so we handle multiple possible formats
    // If the response already has our expected format, return it as-is
    if (apiResponse.sequence && apiResponse.polyline) {
      return {
        success: true,
        sequence: apiResponse.sequence,
        polyline: apiResponse.polyline,
        etaPerStop: apiResponse.etaPerStop || apiResponse.eta_per_stop,
        distanceKm: apiResponse.distanceKm || apiResponse.distance_km || apiResponse.totalDistanceKm,
        estimatedDuration: apiResponse.estimatedDuration || apiResponse.estimated_duration || apiResponse.duration,
        stops: apiResponse.stops || originalStops,
        mock: false,
      };
    }

    // If response has routes array (common OptimoRoute format)
    if (apiResponse.routes && Array.isArray(apiResponse.routes) && apiResponse.routes.length > 0) {
      const route = apiResponse.routes[0];
      return {
        success: true,
        sequence: route.sequence || originalStops.map((_, i) => i),
        polyline: route.polyline || route.geometry,
        etaPerStop: route.etaPerStop || route.eta_per_stop,
        distanceKm: route.distanceKm || route.distance_km || route.totalDistance,
        estimatedDuration: route.estimatedDuration || route.estimated_duration || route.duration,
        stops: route.stops || originalStops,
        mock: false,
      };
    }

    // Fallback: use mock response if we can't parse the API response
    this.logger.warn('Could not parse OptimoRoute API response, using mock format');
    return this.getMockResponse({ driverId: '', stops: originalStops });
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


