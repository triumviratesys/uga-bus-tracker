// Traffic utilities - Currently using basic distance/time calculations
// Can be enhanced later with external traffic APIs or Google Maps when available

export interface DirectionsRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  mode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  departureTime?: Date;
}

export interface DirectionsResponse {
  duration: number; // seconds
  durationInTraffic?: number; // seconds with current traffic
  distance: number; // meters
  steps: any[];
}

export interface DistanceMatrixRequest {
  origins: { lat: number; lng: number }[];
  destinations: { lat: number; lng: number }[];
  mode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  departureTime?: Date;
}

export interface DistanceMatrixResponse {
  rows: {
    elements: {
      duration: number; // seconds
      durationInTraffic?: number; // seconds with current traffic
      distance: number; // meters
      status: string;
    }[];
  }[];
}

/**
 * Calculate straight-line distance between two points (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Estimate travel time based on distance and mode
 * These are rough estimates for campus transit
 */
function estimateDuration(distance: number, mode: string = 'DRIVING'): number {
  const speedMap: Record<string, number> = {
    DRIVING: 15, // 15 m/s (~34 mph campus speed)
    WALKING: 1.4, // 1.4 m/s (~3 mph)
    BICYCLING: 5, // 5 m/s (~11 mph)
    TRANSIT: 12, // 12 m/s (~27 mph bus speed)
  };

  const speed = speedMap[mode] || speedMap.DRIVING;
  return Math.round(distance / speed); // Duration in seconds
}

/**
 * Get basic directions between two points
 * Note: This is a simplified version without Google Maps
 * Returns straight-line distance and estimated time
 */
export async function getDirectionsWithTraffic(
  request: DirectionsRequest
): Promise<DirectionsResponse | null> {
  const { origin, destination, mode = 'DRIVING' } = request;

  try {
    const distance = calculateDistance(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );

    const duration = estimateDuration(distance, mode);

    // Add 10-20% random variation to simulate traffic
    const trafficFactor = 1 + (Math.random() * 0.2 - 0.1); // 0.9 to 1.1
    const durationInTraffic = Math.round(duration * trafficFactor);

    return {
      duration,
      durationInTraffic,
      distance: Math.round(distance),
      steps: [],
    };
  } catch (error) {
    console.error('Error calculating directions:', error);
    return null;
  }
}

/**
 * Get distance matrix - basic implementation
 * Returns distances and durations for multiple origin-destination pairs
 */
export async function getDistanceMatrix(
  request: DistanceMatrixRequest
): Promise<DistanceMatrixResponse | null> {
  const { origins, destinations, mode = 'DRIVING' } = request;

  try {
    const rows = origins.map((origin) => ({
      elements: destinations.map((dest) => {
        const distance = calculateDistance(
          origin.lat,
          origin.lng,
          dest.lat,
          dest.lng
        );

        const duration = estimateDuration(distance, mode);

        // Add traffic variation
        const trafficFactor = 1 + (Math.random() * 0.2 - 0.1);
        const durationInTraffic = Math.round(duration * trafficFactor);

        return {
          duration,
          durationInTraffic,
          distance: Math.round(distance),
          status: 'OK',
        };
      }),
    }));

    return { rows };
  } catch (error) {
    console.error('Error calculating distance matrix:', error);
    return null;
  }
}

/**
 * Calculate traffic delay factor
 * Returns a multiplier (e.g., 1.2 means 20% slower due to traffic)
 */
export function getTrafficDelayFactor(
  normalDuration: number,
  trafficDuration?: number
): number {
  if (!trafficDuration || trafficDuration <= 0) return 1.0;
  return trafficDuration / normalDuration;
}

/**
 * Adjust scheduled arrival time based on traffic
 */
export function adjustArrivalTime(
  scheduledTime: Date,
  normalDuration: number,
  trafficDuration?: number
): Date {
  const delayFactor = getTrafficDelayFactor(normalDuration, trafficDuration);
  const additionalDelay = (delayFactor - 1) * normalDuration * 1000; // Convert to ms

  return new Date(scheduledTime.getTime() + additionalDelay);
}
