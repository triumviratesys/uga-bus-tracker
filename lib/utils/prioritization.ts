import type { VehiclePosition, ScheduleEntry } from '../gtfs/types';

export interface RouteOption {
  route_id: string;
  route_name: string;
  stop_id: string;
  stop_name: string;
  estimated_arrival: number; // Unix timestamp
  scheduled_arrival: string;
  delay?: number; // seconds
  occupancy_status?: VehiclePosition['occupancy_status'];
  occupancy_score: number; // 0-100, lower is better (less crowded)
  time_score: number; // 0-100, lower is better (faster)
  combined_score: number; // Final score based on priority mode
}

/**
 * Convert occupancy status to a numeric score (0-100)
 * Lower score = less crowded
 */
export function getOccupancyScore(status?: VehiclePosition['occupancy_status']): number {
  const scoreMap: Record<string, number> = {
    'EMPTY': 0,
    'MANY_SEATS_AVAILABLE': 20,
    'FEW_SEATS_AVAILABLE': 40,
    'STANDING_ROOM_ONLY': 60,
    'CRUSHED_STANDING_ROOM_ONLY': 80,
    'FULL': 95,
    'NOT_ACCEPTING_PASSENGERS': 100
  };

  return scoreMap[status || ''] ?? 50; // Default to middle if unknown
}

/**
 * Calculate time score based on how soon the bus arrives (0-100)
 * Lower score = arriving sooner
 */
export function getTimeScore(
  estimatedArrival: number,
  currentTime: number = Date.now()
): number {
  const waitTime = (estimatedArrival - currentTime) / 1000; // seconds

  // Normalize wait time to 0-100 score
  // 0 minutes = 0 score, 30+ minutes = 100 score
  const maxWaitTime = 30 * 60; // 30 minutes
  const score = Math.min(100, (waitTime / maxWaitTime) * 100);

  return Math.max(0, score);
}

/**
 * Calculate combined score based on priority mode
 * @param timeScore - Time score (0-100, lower is better)
 * @param occupancyScore - Occupancy score (0-100, lower is better)
 * @param priorityMode - 'time' or 'occupancy'
 * @param timeWeight - Weight for time factor (0-1), only used if custom weighting needed
 */
export function calculateCombinedScore(
  timeScore: number,
  occupancyScore: number,
  priorityMode: 'time' | 'occupancy' = 'time',
  timeWeight?: number
): number {
  if (timeWeight !== undefined) {
    // Custom weighting
    return timeScore * timeWeight + occupancyScore * (1 - timeWeight);
  }

  // Preset modes
  if (priorityMode === 'time') {
    // 70% weight on time, 30% on occupancy
    return timeScore * 0.7 + occupancyScore * 0.3;
  } else {
    // 30% weight on time, 70% on occupancy
    return timeScore * 0.3 + occupancyScore * 0.7;
  }
}

/**
 * Sort and rank route options based on priority mode
 */
export function prioritizeRoutes(
  options: Omit<RouteOption, 'occupancy_score' | 'time_score' | 'combined_score'>[],
  priorityMode: 'time' | 'occupancy' = 'time',
  currentTime: number = Date.now()
): RouteOption[] {
  const scoredOptions: RouteOption[] = options.map(option => {
    const occupancyScore = getOccupancyScore(option.occupancy_status);
    const timeScore = getTimeScore(option.estimated_arrival, currentTime);
    const combinedScore = calculateCombinedScore(timeScore, occupancyScore, priorityMode);

    return {
      ...option,
      occupancy_score: occupancyScore,
      time_score: timeScore,
      combined_score: combinedScore
    };
  });

  // Sort by combined score (lower is better)
  return scoredOptions.sort((a, b) => a.combined_score - b.combined_score);
}

/**
 * Filter routes by maximum wait time
 */
export function filterByMaxWaitTime(
  options: RouteOption[],
  maxWaitMinutes: number,
  currentTime: number = Date.now()
): RouteOption[] {
  const maxWaitMs = maxWaitMinutes * 60 * 1000;

  return options.filter(option => {
    const waitTime = option.estimated_arrival - currentTime;
    return waitTime <= maxWaitMs && waitTime >= 0;
  });
}

/**
 * Filter routes by maximum occupancy
 */
export function filterByMaxOccupancy(
  options: RouteOption[],
  maxOccupancyScore: number
): RouteOption[] {
  return options.filter(option => option.occupancy_score <= maxOccupancyScore);
}

/**
 * Get recommended route with explanations
 */
export function getRecommendation(
  options: RouteOption[],
  priorityMode: 'time' | 'occupancy' = 'time'
): {
  recommendation: RouteOption | null;
  alternatives: RouteOption[];
  reason: string;
} {
  if (options.length === 0) {
    return {
      recommendation: null,
      alternatives: [],
      reason: 'No routes available at this time.'
    };
  }

  const best = options[0];
  const alternatives = options.slice(1, 4); // Top 3 alternatives

  let reason = '';
  if (priorityMode === 'time') {
    const waitMinutes = Math.round((best.estimated_arrival - Date.now()) / 60000);
    reason = `Arrives in ${waitMinutes} minutes`;
    if (best.occupancy_score < 40) {
      reason += ' with plenty of space available';
    }
  } else {
    const occupancyLevel = best.occupancy_status?.replace(/_/g, ' ').toLowerCase() || 'moderate occupancy';
    reason = `Best available capacity (${occupancyLevel})`;
    const waitMinutes = Math.round((best.estimated_arrival - Date.now()) / 60000);
    reason += `, arrives in ${waitMinutes} minutes`;
  }

  return {
    recommendation: best,
    alternatives,
    reason
  };
}
