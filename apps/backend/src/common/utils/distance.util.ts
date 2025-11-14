/**
 * Distance calculation utilities using Haversine formula
 */

/**
 * Convert degrees to radians
 */
function toRad(deg: number): number {
  return deg * Math.PI / 180;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

/**
 * Calculate distance between two coordinates in meters
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in meters
 */
export function haversineDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversineDistance(lat1, lng1, lat2, lng2) * 1000;
}

/**
 * Check if two locations are within a specified tolerance distance
 * @param loc1 First location { lat, lng }
 * @param loc2 Second location { lat, lng }
 * @param toleranceMeters Tolerance distance in meters
 * @returns True if locations are within tolerance
 */
export function areLocationsNearby(
  loc1: { lat: number; lng: number },
  loc2: { lat: number; lng: number },
  toleranceMeters: number
): boolean {
  const distanceMeters = haversineDistanceMeters(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
  return distanceMeters <= toleranceMeters;
}

