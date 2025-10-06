import { NextResponse } from 'next/server';
import { getStops, getStopSchedule, getRoutes, getTrips } from '@/lib/gtfs/static-loader';
import { getTripUpdates } from '@/lib/gtfs/realtime-loader';
import { getDirectionsWithTraffic } from '@/lib/maps/traffic';
import type { ScheduleEntry } from '@/lib/gtfs/types';

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

  // If time has passed today, schedule for tomorrow
  if (scheduled < now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }

  return scheduled;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stopId = searchParams.get('stop_id');
    const routeId = searchParams.get('route_id');
    const useTraffic = searchParams.get('traffic') === 'true';

    if (!stopId) {
      return NextResponse.json(
        { error: 'stop_id parameter is required' },
        { status: 400 }
      );
    }

    // Get static schedule
    const stopTimes = await getStopSchedule(stopId);
    const routes = await getRoutes();
    const trips = await getTrips();
    const stops = await getStops();

    // Get real-time updates
    const tripUpdates = await getTripUpdates();

    // Build schedule entries
    const scheduleEntries: ScheduleEntry[] = [];

    for (const stopTime of stopTimes) {
      const trip = trips.find(t => t.trip_id === stopTime.trip_id);
      if (!trip) continue;

      if (routeId && trip.route_id !== routeId) continue;

      const route = routes.find(r => r.route_id === trip.route_id);
      const stop = stops.find(s => s.stop_id === stopId);

      if (!route || !stop) continue;

      // Find real-time update for this trip
      const tripUpdate = tripUpdates.find(tu => tu.trip_id === stopTime.trip_id);
      const stopTimeUpdate = tripUpdate?.stop_time_updates.find(
        stu => stu.stop_id === stopId || stu.stop_sequence === stopTime.stop_sequence
      );

      const scheduledTime = getNextOccurrence(stopTime.arrival_time);
      let estimatedArrival = scheduledTime.getTime();
      let delay = 0;

      // Apply real-time delay if available
      if (stopTimeUpdate?.arrival) {
        delay = stopTimeUpdate.arrival.delay || 0;
        estimatedArrival += delay * 1000;
      }

      scheduleEntries.push({
        stop_id: stopId,
        stop_name: stop.stop_name,
        route_id: trip.route_id,
        route_name: route.route_short_name || route.route_long_name,
        scheduled_arrival: stopTime.arrival_time,
        estimated_arrival: estimatedArrival,
        delay
      });
    }

    // Sort by estimated arrival time
    scheduleEntries.sort((a, b) => a.estimated_arrival! - b.estimated_arrival!);

    // Filter to next few hours
    const now = Date.now();
    const maxTime = now + 4 * 60 * 60 * 1000; // Next 4 hours
    const upcomingSchedule = scheduleEntries.filter(
      entry => entry.estimated_arrival! >= now && entry.estimated_arrival! <= maxTime
    );

    // Optionally adjust for traffic (if enabled)
    if (useTraffic && upcomingSchedule.length > 0) {
      // This is a simplified implementation
      // In a real app, you'd calculate traffic for each segment of each route
      console.log('Traffic adjustment requested but not fully implemented yet');
    }

    return NextResponse.json({
      stop_id: stopId,
      schedule: upcomingSchedule.slice(0, 20) // Return next 20 arrivals
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}
