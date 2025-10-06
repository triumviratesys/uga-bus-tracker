'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useRoutes() {
  return useSWR('/api/routes', fetcher, {
    refreshInterval: 0, // Static data, no refresh needed
    revalidateOnFocus: false
  });
}

export function useStops() {
  return useSWR('/api/stops', fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false
  });
}

export function useVehicles(routeId?: string) {
  const url = routeId ? `/api/vehicles?route_id=${routeId}` : '/api/vehicles';
  return useSWR(url, fetcher, {
    refreshInterval: 10000, // Refresh every 10 seconds
    revalidateOnFocus: true
  });
}

export function useSchedule(stopId: string, routeId?: string) {
  const url = routeId
    ? `/api/schedule?stop_id=${stopId}&route_id=${routeId}`
    : `/api/schedule?stop_id=${stopId}`;

  return useSWR(stopId ? url : null, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true
  });
}

export function useDirections(fromStopId?: string, toStopId?: string, priority: 'time' | 'occupancy' = 'time') {
  const url = fromStopId && toStopId
    ? `/api/directions?from=${fromStopId}&to=${toStopId}&priority=${priority}`
    : null;

  return useSWR(url, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true
  });
}

export function useFavorites() {
  return useSWR('/api/favorites', fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: true
  });
}
