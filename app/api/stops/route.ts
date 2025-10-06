import { NextResponse } from 'next/server';
import { getStops, getStopSchedule } from '@/lib/gtfs/static-loader';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stopId = searchParams.get('stop_id');

    if (stopId) {
      // Get specific stop with schedule
      const stops = await getStops();
      const stop = stops.find(s => s.stop_id === stopId);

      if (!stop) {
        return NextResponse.json(
          { error: 'Stop not found' },
          { status: 404 }
        );
      }

      const schedule = await getStopSchedule(stopId);

      return NextResponse.json({
        ...stop,
        schedule: schedule.slice(0, 50) // Limit to next 50 arrivals
      });
    }

    // Get all stops
    const stops = await getStops();
    return NextResponse.json(stops);
  } catch (error) {
    console.error('Error fetching stops:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stops' },
      { status: 500 }
    );
  }
}
