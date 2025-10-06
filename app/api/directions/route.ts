import { NextResponse } from 'next/server';
import { getStops, getStopSchedule, getRoutes, getTrips, getStopTimes } from '@/lib/gtfs/static-loader';
import { getTripUpdates, getEnrichedVehicles } from '@/lib/gtfs/realtime-loader';
import { prioritizeRoutes } from '@/lib/utils/prioritization';
import type { RouteOption } from '@/lib/utils/prioritization';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseTime(timeStr: string): { hours: number; minutes: number; seconds: number } {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return { hours, minutes, seconds };
}

function getNextOccurrence(timeStr: string): Date {
  const { hours, minutes, seconds } = parseTime(timeStr);
  const now = new Date();
  const scheduled = new Date();

  scheduled.setHours(hours % 24, minutes, seconds, 0);

  if (scheduled < now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }

  return scheduled;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromStopId = searchParams.get('from');
    const toStopId = searchParams.get('to');
    const priorityMode = (searchParams.get('priority') as 'time' | 'occupancy') || 'time';
    const maxWait = parseInt(searchParams.get('max_wait') || '30');

    if (!fromStopId || !toStopId) {
      return NextResponse.json(
        { error: 'Both from and to stop IDs are required' },
        { status: 400 }
      );
    }

    const stops = await getStops();
    const routes = await getRoutes();
    const trips = await getTrips();
    const allStopTimes = await getStopTimes();
    const tripUpdates = await getTripUpdates();
    const vehicles = await getEnrichedVehicles();

    const fromStop = stops.find(s => s.stop_id === fromStopId);
    const toStop = stops.find(s => s.stop_id === toStopId);

    if (!fromStop || !toStop) {
      return NextResponse.json(
        { error: 'One or both stops not found' },
        { status: 404 }
      );
    }

    // Find trips that serve both stops in the correct order
    const validTrips = new Map<string, { fromSeq: number; toSeq: number; tripId: string }>();

    for (const trip of trips) {
      const tripStopTimes = allStopTimes
        .filter(st => st.trip_id === trip.trip_id)
        .sort((a, b) => a.stop_sequence - b.stop_sequence);

      const fromStopTime = tripStopTimes.find(st => st.stop_id === fromStopId);
      const toStopTime = tripStopTimes.find(st => st.stop_id === toStopId);

      if (fromStopTime && toStopTime && fromStopTime.stop_sequence < toStopTime.stop_sequence) {
        validTrips.set(trip.trip_id, {
          fromSeq: fromStopTime.stop_sequence,
          toSeq: toStopTime.stop_sequence,
          tripId: trip.trip_id
        });
      }
    }

    // Build route options
    const options: Omit<RouteOption, 'occupancy_score' | 'time_score' | 'combined_score'>[] = [];

    for (const [tripId, tripInfo] of validTrips.entries()) {
      const trip = trips.find(t => t.trip_id === tripId);
      if (!trip) continue;

      const route = routes.find(r => r.route_id === trip.route_id);
      if (!route) continue;

      const fromStopTime = allStopTimes.find(
        st => st.trip_id === tripId && st.stop_sequence === tripInfo.fromSeq
      );
      if (!fromStopTime) continue;

      // Get real-time updates
      const tripUpdate = tripUpdates.find(tu => tu.trip_id === tripId);
      const fromStopUpdate = tripUpdate?.stop_time_updates.find(
        stu => stu.stop_sequence === tripInfo.fromSeq
      );

      const scheduledTime = getNextOccurrence(fromStopTime.departure_time);
      let estimatedArrival = scheduledTime.getTime();
      let delay = 0;

      if (fromStopUpdate?.departure) {
        delay = fromStopUpdate.departure.delay || 0;
        estimatedArrival += delay * 1000;
      }

      // Find vehicle for this trip to get occupancy
      const vehicle = vehicles.find(v => v.trip_id === tripId);

      // Only include if arriving within max wait time
      const waitTime = (estimatedArrival - Date.now()) / 60000; // minutes
      if (waitTime >= 0 && waitTime <= maxWait) {
        options.push({
          route_id: trip.route_id,
          route_name: route.route_short_name || route.route_long_name,
          stop_id: fromStopId,
          stop_name: fromStop.stop_name,
          estimated_arrival: estimatedArrival,
          scheduled_arrival: fromStopTime.departure_time,
          delay,
          occupancy_status: vehicle?.occupancy_status
        });
      }
    }

    // Prioritize routes
    const prioritizedOptions = prioritizeRoutes(options, priorityMode);

    return NextResponse.json({
      from: {
        stop_id: fromStopId,
        stop_name: fromStop.stop_name,
        lat: fromStop.stop_lat,
        lng: fromStop.stop_lon
      },
      to: {
        stop_id: toStopId,
        stop_name: toStop.stop_name,
        lat: toStop.stop_lat,
        lng: toStop.stop_lon
      },
      priority_mode: priorityMode,
      options: prioritizedOptions
    });
  } catch (error) {
    console.error('Error calculating directions:', error);
    return NextResponse.json(
      { error: 'Failed to calculate directions' },
      { status: 500 }
    );
  }
}
