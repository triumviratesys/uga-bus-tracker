import { NextResponse } from 'next/server';
import { getRoutes, getRouteShape } from '@/lib/gtfs/static-loader';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('route_id');

    if (routeId) {
      // Get specific route with shape
      const routes = await getRoutes();
      const route = routes.find(r => r.route_id === routeId);

      if (!route) {
        return NextResponse.json(
          { error: 'Route not found' },
          { status: 404 }
        );
      }

      const shape = await getRouteShape(routeId);

      return NextResponse.json({
        ...route,
        shape: shape.map(s => ({
          lat: s.shape_pt_lat,
          lng: s.shape_pt_lon,
          sequence: s.shape_pt_sequence
        }))
      });
    }

    // Get all routes
    const routes = await getRoutes();
    return NextResponse.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routes' },
      { status: 500 }
    );
  }
}
