import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface OptimizeRoutePayload {
  driverId: string;
  stops: Array<{ lat: number; lng: number; orderId?: string }>;
}

interface OptimoRouteOrder {
  orderNo: string;
  type: 'P' | 'D' | 'T'; // P=Pickup, D=Delivery, T=Transport
  date: string; // YYYY-MM-DD
  duration?: number; // minutes
  priority?: 'L' | 'M' | 'H'; // Low, Medium, High
  relatedOrderNo?: string; // Link delivery to pickup
  location: {
    address: string;
    latitude: number;
    longitude: number;
    locationName?: string;
  };
  assignedTo?: {
    externalId?: string;
    serial?: string;
  };
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

  /**
   * Delete all orders from OptimoRoute (clean slate before creating new ones)
   */
  async deleteAllOrders(): Promise<boolean> {
    if (!this.apiKey || this.apiKey === 'your_optimoroute_key_here') {
      this.logger.warn('OptimoRoute API key not configured, skipping delete');
      return true;
    }

    try {
      const url = `${this.baseUrl}/delete_all_orders`;
      this.logger.log(`Deleting all orders from OptimoRoute`);
      
      const response = await axios.post(url, {}, {
        params: { key: this.apiKey },
        timeout: 30000,
      });

      if (response.data?.success) {
        this.logger.log('Successfully deleted all orders from OptimoRoute');
        return true;
      }
      return false;
    } catch (error: any) {
      this.logger.warn(`Failed to delete orders from OptimoRoute: ${error.message}`);
      // Don't throw - continue with creating orders
      return false;
    }
  }

  /**
   * Create or update orders in bulk
   */
  async createOrUpdateOrders(orders: OptimoRouteOrder[]): Promise<any> {
    if (!this.apiKey || this.apiKey === 'your_optimoroute_key_here') {
      this.logger.warn('OptimoRoute API key not configured, using mock');
      return { success: true, orders: [] };
    }

    try {
      const url = `${this.baseUrl}/create_or_update_orders`;
      this.logger.log(`Creating/updating ${orders.length} orders in OptimoRoute`);
      
      const response = await axios.post(url, { orders }, {
        params: { key: this.apiKey },
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000, // 60 seconds for bulk operations
      });

      if (response.data?.success) {
        this.logger.log(`Successfully created/updated ${orders.length} orders`);
        return response.data;
      }
      
      throw new Error(`OptimoRoute API returned success=false: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      this.logger.error(`Failed to create/update orders: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  /**
   * Start planning/optimization for a specific date
   */
  async startPlanning(date: string): Promise<any> {
    if (!this.apiKey || this.apiKey === 'your_optimoroute_key_here') {
      this.logger.warn('OptimoRoute API key not configured, using mock');
      return { success: true };
    }

    try {
      const url = `${this.baseUrl}/start_planning`;
      this.logger.log(`Starting planning for date: ${date}`);
      
      const response = await axios.post(url, { date }, {
        params: { key: this.apiKey },
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000, // Planning can take time
      });

      if (response.data?.success) {
        this.logger.log('Planning started successfully');
        return response.data;
      }
      
      throw new Error(`OptimoRoute planning failed: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      this.logger.error(`Failed to start planning: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  /**
   * Get routes for a specific date
   */
  async getRoutes(date: string): Promise<any> {
    if (!this.apiKey || this.apiKey === 'your_optimoroute_key_here') {
      this.logger.warn('OptimoRoute API key not configured, using mock');
      return { success: true, routes: [] };
    }

    try {
      const url = `${this.baseUrl}/get_routes`;
      this.logger.log(`Getting routes for date: ${date}`);
      
      const response = await axios.get(url, {
        params: { key: this.apiKey, date },
        timeout: 30000,
      });

      if (response.data?.success) {
        this.logger.log('Successfully retrieved routes');
        return response.data;
      }
      
      throw new Error(`OptimoRoute get routes failed: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      this.logger.error(`Failed to get routes: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  /**
   * Get planning status
   */
  async getPlanningStatus(date: string): Promise<any> {
    if (!this.apiKey || this.apiKey === 'your_optimoroute_key_here') {
      this.logger.warn('OptimoRoute API key not configured, using mock');
      return { success: true, status: 'completed' };
    }

    try {
      const url = `${this.baseUrl}/get_planning_status`;
      this.logger.log(`Getting planning status for date: ${date}`);
      
      const response = await axios.get(url, {
        params: { key: this.apiKey, date },
        timeout: 30000,
      });

      if (response.data?.success) {
        return response.data;
      }
      
      throw new Error(`OptimoRoute get planning status failed: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      this.logger.error(`Failed to get planning status: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  /**
   * Get scheduling information (stop sequence, times, distances)
   */
  async getSchedulingInformation(date: string): Promise<any> {
    if (!this.apiKey || this.apiKey === 'your_optimoroute_key_here') {
      this.logger.warn('OptimoRoute API key not configured, using mock');
      return { success: true, orders: [] };
    }

    try {
      const url = `${this.baseUrl}/get_scheduling_information`;
      this.logger.log(`Getting scheduling information for date: ${date}`);
      
      const response = await axios.get(url, {
        params: { key: this.apiKey, date },
            timeout: 30000,
          });
          
      if (response.data?.success) {
        this.logger.log('Successfully retrieved scheduling information');
        return response.data;
      }
      
      throw new Error(`OptimoRoute get scheduling failed: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      this.logger.error(`Failed to get scheduling information: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  /**
   * Optimize route for subscription orders using proper OptimoRoute API workflow
   */
  async optimizeSubscriptionOrdersRoute(
    orders: Array<{
      orderId: string;
      pickup: { lat: number; lng: number; address: string };
      dropoff: { lat: number; lng: number; address: string };
    }>,
    driverExternalId?: string,
    date?: string
  ): Promise<any> {
    if (!this.apiKey || this.apiKey === 'your_optimoroute_key_here') {
      this.logger.warn('OptimoRoute API key not configured, using mock response');
      return this.getMockResponse({ driverId: '', stops: [] });
    }

    const targetDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      // Step 1: Delete all existing orders (clean slate)
      await this.deleteAllOrders();

      // Step 2: Create orders in OptimoRoute format
      // For subscription orders, all pickups are typically at the same location
      // So we create ONE pickup order and link all deliveries to it
      const optimoRouteOrders: OptimoRouteOrder[] = [];
      
      // Find the most common pickup location (or use first one if all are same)
      // Group orders by pickup location (with tolerance for slight differences)
      const pickupLocationMap = new Map<string, { lat: number; lng: number; address: string; count: number }>();
      const PICKUP_TOLERANCE = 0.0001; // ~11 meters
      
      for (const order of orders) {
        const pickupKey = `${Math.round(order.pickup.lat / PICKUP_TOLERANCE)}_${Math.round(order.pickup.lng / PICKUP_TOLERANCE)}`;
        if (pickupLocationMap.has(pickupKey)) {
          pickupLocationMap.get(pickupKey)!.count++;
        } else {
          pickupLocationMap.set(pickupKey, {
            lat: order.pickup.lat,
            lng: order.pickup.lng,
            address: order.pickup.address || 'Pickup Location',
            count: 1
          });
        }
      }
      
      // Find the pickup location with most orders (or first one if all same)
      const mainPickupLocation = Array.from(pickupLocationMap.values())
        .sort((a, b) => b.count - a.count)[0];
      
      this.logger.log(`Found ${pickupLocationMap.size} unique pickup location(s). Using main pickup: ${mainPickupLocation.lat}, ${mainPickupLocation.lng} (used by ${mainPickupLocation.count} orders)`);
      
      // Create ONE pickup order for all subscription orders
      // Note: We don't assign to driver here because OptimoRoute requires driver to exist first
      // The route will be optimized without driver assignment, then we'll track it in our system
      const pickupOrderNo = 'PICKUP_SUBSCRIPTION_ALL';
      const pickupOrder: OptimoRouteOrder = {
        orderNo: pickupOrderNo,
        type: 'P',
        date: targetDate,
        duration: 10, // 10 minutes for bulk pickup
        priority: 'M',
        location: {
          address: mainPickupLocation.address,
          latitude: mainPickupLocation.lat,
          longitude: mainPickupLocation.lng,
          locationName: 'Subscription Pickup Location',
        },
      };

      // Don't assign to driver - OptimoRoute will optimize without driver assignment
      // The driver assignment is tracked in our system, not OptimoRoute
      // if (driverExternalId) {
      //   pickupOrder.assignedTo = { externalId: driverExternalId };
      // }

      optimoRouteOrders.push(pickupOrder);

      // Create delivery orders, all linked to the single pickup
      for (const order of orders) {
        const deliveryOrder: OptimoRouteOrder = {
          orderNo: `DELIVERY_${order.orderId}`,
          type: 'D',
          date: targetDate,
          duration: 10, // 10 minutes for delivery
          priority: 'M',
          relatedOrderNo: pickupOrderNo, // All deliveries linked to the single pickup
          location: {
            address: order.dropoff.address || 'Delivery Location',
            latitude: order.dropoff.lat,
            longitude: order.dropoff.lng,
            locationName: `Delivery ${order.orderId.substring(0, 8)}`,
          },
        };

        // Don't assign to driver - OptimoRoute will optimize without driver assignment
        // if (driverExternalId) {
        //   deliveryOrder.assignedTo = { externalId: driverExternalId };
        // }

        optimoRouteOrders.push(deliveryOrder);
      }
      
      this.logger.log(`Created 1 pickup order and ${orders.length} delivery orders (total: ${optimoRouteOrders.length} orders)`);

      // Step 3: Create/update orders in bulk
      await this.createOrUpdateOrders(optimoRouteOrders);

      // Step 4: Start planning
      await this.startPlanning(targetDate);

      // Step 5: Poll planning status until complete (OptimoRoute processes asynchronously)
      let planningComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // Maximum 30 attempts (30 seconds)
      
      while (!planningComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between checks
        attempts++;
        
        try {
          const statusResponse = await this.getPlanningStatus(targetDate);
          if (statusResponse?.status === 'completed' || statusResponse?.status === 'finished') {
            planningComplete = true;
            this.logger.log(`Planning completed after ${attempts} seconds`);
            break;
          } else if (statusResponse?.status === 'failed' || statusResponse?.status === 'error') {
            this.logger.warn(`Planning failed with status: ${statusResponse.status}`);
            break;
          }
          // Continue polling if status is 'running' or 'in_progress'
        } catch (error: any) {
          this.logger.warn(`Error checking planning status (attempt ${attempts}): ${error.message}`);
          // Continue polling on error
        }
      }

      if (!planningComplete) {
        this.logger.warn(`Planning did not complete within ${maxAttempts} seconds, proceeding anyway`);
      }

      // Step 6: Get routes (contains route geometry/polyline)
      const routesResponse = await this.getRoutes(targetDate);
      this.logger.log(`Routes response: ${JSON.stringify(routesResponse).substring(0, 500)}`);

      // Step 7: Get scheduling information (has stop sequence and times)
      const schedulingResponse = await this.getSchedulingInformation(targetDate);
      this.logger.log(`Scheduling response orders count: ${schedulingResponse?.orders?.length || 0}`);

      // Step 8: Transform response to our format
      return this.transformOptimoRouteResponse(
        routesResponse,
        schedulingResponse,
        orders,
        targetDate
      );
    } catch (error: any) {
      this.logger.error(`Failed to optimize subscription orders route: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transform OptimoRoute API response to our internal format
   */
  private transformOptimoRouteResponse(
    routesResponse: any,
    schedulingResponse: any,
    originalOrders: Array<{
      orderId: string;
      pickup: { lat: number; lng: number; address: string };
      dropoff: { lat: number; lng: number; address: string };
    }>,
    targetDate?: string
  ) {
    const stops: Array<{ lat: number; lng: number; orderId?: string; type?: string; sequence?: number; eta?: number }> = [];
    const sequence: number[] = [];
    let totalDistance = 0;
    const etaPerStop: number[] = [];

    // Log the responses for debugging
    this.logger.log(`Transforming OptimoRoute response. Routes: ${JSON.stringify(routesResponse).substring(0, 200)}`);
    this.logger.log(`Scheduling orders: ${schedulingResponse?.orders?.length || 0}`);

    // Extract scheduling information to get stop sequence
    if (schedulingResponse?.orders && Array.isArray(schedulingResponse.orders)) {
      // Sort by stopNumber to get sequence
      const scheduledOrders = schedulingResponse.orders
        .filter((o: any) => o.scheduleInformation?.stopNumber != null)
        .sort((a: any, b: any) => 
          a.scheduleInformation.stopNumber - b.scheduleInformation.stopNumber
        );

      // Track if we've already added the pickup location
      let pickupAdded = false;
      const pickupLocationKey = 'PICKUP_SUBSCRIPTION_ALL';
      
      for (const scheduledOrder of scheduledOrders) {
        const scheduleInfo = scheduledOrder.scheduleInformation;
        const orderNo = scheduledOrder.data?.orderNo || '';
        const isPickup = orderNo.startsWith('PICKUP_');
        
        if (isPickup) {
          // For subscription orders, we only add the pickup location once
          if (!pickupAdded) {
            // Find the main pickup location from any order (they should all be the same)
            const firstOrder = originalOrders[0];
            if (firstOrder) {
              const stopIndex = stops.length;
              stops.push({
                lat: firstOrder.pickup.lat,
                lng: firstOrder.pickup.lng,
                orderId: 'SUBSCRIPTION_PICKUP',
                type: 'pickup',
                sequence: scheduleInfo.stopNumber,
                eta: scheduleInfo.arrivalTimeDt ? 
                  Math.floor(new Date(scheduleInfo.arrivalTimeDt).getTime() / 1000) : undefined,
              });
              sequence.push(stopIndex);
              pickupAdded = true;
              
              if (scheduleInfo.distance) {
                totalDistance += scheduleInfo.distance / 1000; // Convert meters to km
              }
            }
          }
          // Skip if pickup already added
          continue;
        }
        
        // Process delivery orders
        const orderIdMatch = orderNo.match(/DELIVERY_(.+)/);
        const orderId = orderIdMatch ? orderIdMatch[1] : '';
        
        // Find original order
        const originalOrder = originalOrders.find(o => o.orderId === orderId);
        if (!originalOrder) {
          this.logger.warn(`Could not find original order for ${orderNo}`);
          continue;
        }

        const stopIndex = stops.length;
        stops.push({
          lat: originalOrder.dropoff.lat,
          lng: originalOrder.dropoff.lng,
          orderId: orderId,
          type: 'dropoff',
          sequence: scheduleInfo.stopNumber,
          eta: scheduleInfo.arrivalTimeDt ? 
            Math.floor(new Date(scheduleInfo.arrivalTimeDt).getTime() / 1000) : undefined,
        });

        // Sequence array contains indices in the order they should be visited
        sequence.push(stopIndex);
        
        if (scheduleInfo.distance) {
          totalDistance += scheduleInfo.distance / 1000; // Convert meters to km
        }
      }
      
      this.logger.log(`Processed ${stops.length} stops in sequence order. Sequence array length: ${sequence.length}`);
      this.logger.log(`First 5 stops: ${stops.slice(0, 5).map(s => `${s.type}(${s.sequence})`).join(', ')}`);
      this.logger.log(`Sequence array (first 10): [${sequence.slice(0, 10).join(', ')}]`);
    } else {
      this.logger.warn('No scheduling information available, using fallback order');
      // Fallback: use original order sequence with pickup before delivery
      for (const order of originalOrders) {
        const pickupIndex = stops.length;
        stops.push({
          lat: order.pickup.lat,
          lng: order.pickup.lng,
          orderId: order.orderId,
          type: 'pickup',
        });
        sequence.push(pickupIndex);
        
        const deliveryIndex = stops.length;
        stops.push({
          lat: order.dropoff.lat,
          lng: order.dropoff.lng,
          orderId: order.orderId,
          type: 'dropoff',
        });
        sequence.push(deliveryIndex);
      }
      this.logger.log(`Fallback: Created ${stops.length} stops, sequence length: ${sequence.length}`);
    }

    // Generate polyline from stops in sequence order
    // The sequence array contains indices into the stops array in the correct order
    // This ensures pickup comes before delivery for each order (as per OptimoRoute optimization)
    let polyline: string;
    if (sequence.length > 0 && sequence.length === stops.length) {
      // Use sequence array to get stops in the correct order
      // The sequence array tells us which stop comes first, second, third, etc.
      const polylinePoints: string[] = [];
      
      for (let i = 0; i < sequence.length; i++) {
        const stopIndex = sequence[i];
        if (stopIndex >= 0 && stopIndex < stops.length) {
          const stop = stops[stopIndex];
          polylinePoints.push(`${stop.lat},${stop.lng}`);
        } else {
          this.logger.warn(`Invalid stop index ${stopIndex} at sequence position ${i}, stops length: ${stops.length}`);
        }
      }
      
      polyline = polylinePoints.join(';');
      this.logger.log(`Generated polyline with ${polylinePoints.length} points from ${sequence.length} sequence indices`);
      this.logger.log(`Polyline first 3 points: ${polylinePoints.slice(0, 3).join('; ')}`);
    } else {
      // Fallback: use stops in order they were added
      polyline = stops.map((stop) => `${stop.lat},${stop.lng}`).join(';');
      this.logger.warn(`Sequence length (${sequence.length}) doesn't match stops length (${stops.length}), using stops order`);
    }

    // Calculate total duration from scheduling info
    let estimatedDuration = 0;
    if (schedulingResponse?.orders && targetDate) {
      const lastOrder = schedulingResponse.orders
        .filter((o: any) => o.scheduleInformation?.arrivalTimeDt)
        .sort((a: any, b: any) => 
          new Date(b.scheduleInformation.arrivalTimeDt).getTime() - 
          new Date(a.scheduleInformation.arrivalTimeDt).getTime()
        )[0];
      
      if (lastOrder?.scheduleInformation?.arrivalTimeDt) {
        const startTime = new Date(targetDate + 'T00:00:00').getTime();
        const endTime = new Date(lastOrder.scheduleInformation.arrivalTimeDt).getTime();
        estimatedDuration = Math.floor((endTime - startTime) / 1000); // seconds
      }
    }

      return {
        success: true,
      sequence,
      polyline,
      stops,
      distanceKm: parseFloat(totalDistance.toFixed(2)),
      estimatedDuration,
      etaPerStop: etaPerStop.length > 0 ? etaPerStop : undefined,
        mock: false,
      };
    }

  /**
   * Legacy method for backward compatibility
   */
  async optimizeRoute(payload: OptimizeRoutePayload) {
    // Use mock response if API key is not configured (for testing)
    if (!this.apiKey || this.apiKey === 'your_optimoroute_key_here') {
      this.logger.warn('OptimoRoute API key not configured, using mock response');
      return this.getMockResponse(payload);
    }

    // For simple route optimization without OptimoRoute workflow
    return this.getMockResponse(payload);
  }

  /**
   * Generate mock optimization response for testing
   */
  private getMockResponse(payload: OptimizeRoutePayload) {
    const { stops } = payload;

    if (stops.length === 0) {
      return {
        success: true,
        sequence: [],
        polyline: '',
        stops: [],
        distanceKm: 0,
        estimatedDuration: 0,
        etaPerStop: [],
        mock: true,
      };
    }

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
      stops: stops.map(s => ({ ...s, type: 'stop' })),
      distanceKm: parseFloat(totalDistance.toFixed(2)),
      estimatedDuration: etaPerStop[etaPerStop.length - 1],
      etaPerStop,
      mock: true,
      algorithm: 'simple-mock',
    };
  }
}
