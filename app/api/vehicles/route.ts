import { NextResponse } from 'next/server';
import { getEnrichedVehicles } from '@/lib/gtfs/realtime-loader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('route_id');

    const vehicles = await getEnrichedVehicles();

    if (routeId) {
      // Filter by route
      const filteredVehicles = vehicles.filter(v => v.route_id === routeId);
      return NextResponse.json(filteredVehicles);
    }

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}
