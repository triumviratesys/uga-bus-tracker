'use client';

import dynamic from 'next/dynamic';
import type { EnrichedVehicle } from '@/lib/gtfs/types';
import type { GTFSStop, GTFSRoute } from '@/lib/gtfs/types';

interface MapComponentProps {
  vehicles: EnrichedVehicle[];
  stops: GTFSStop[];
  routes: GTFSRoute[];
  selectedRoute?: string;
  selectedStop?: string;
  onStopClick?: (stop: GTFSStop) => void;
  onRouteClick?: (route: GTFSRoute) => void;
}

// Dynamic import with no SSR to prevent Leaflet from running on the server
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

export default function DynamicMap(props: MapComponentProps) {
  return <MapComponent {...props} />;
}
