'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { EnrichedVehicle } from '@/lib/gtfs/types';
import type { GTFSStop, GTFSRoute } from '@/lib/gtfs/types';

// Fix for default marker icons in Leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapComponentProps {
  vehicles: EnrichedVehicle[];
  stops: GTFSStop[];
  routes: GTFSRoute[];
  selectedRoute?: string;
  selectedStop?: string;
  onStopClick?: (stop: GTFSStop) => void;
  onRouteClick?: (route: GTFSRoute) => void;
}

// Component to update map view
function MapUpdater({ selectedStop, stops }: { selectedStop?: string; stops: GTFSStop[] }) {
  const map = useMap();

  useEffect(() => {
    if (selectedStop && stops.length > 0) {
      const stop = stops.find(s => s.stop_id === selectedStop);
      if (stop) {
        map.setView([stop.stop_lat, stop.stop_lon], 16);
      }
    }
  }, [selectedStop, stops, map]);

  return null;
}

export default function MapComponent({
  vehicles,
  stops,
  routes,
  selectedRoute,
  selectedStop,
  onStopClick,
  onRouteClick
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Create custom icons for buses based on route color
  const createBusIcon = (route: GTFSRoute | undefined, bearing?: number) => {
    const color = route?.route_color ? `#${route.route_color}` : '#3B82F6';
    const rotation = bearing || 0;

    return L.divIcon({
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          transform: rotate(${rotation}deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          <div style="
            width: 0;
            height: 0;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-bottom: 8px solid white;
            transform: translateY(-2px);
          "></div>
        </div>
      `,
      className: 'bus-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  // Create custom icons for stops
  const createStopIcon = (isSelected: boolean) => {
    return L.divIcon({
      html: `
        <div style="
          width: ${isSelected ? '16px' : '10px'};
          height: ${isSelected ? '16px' : '10px'};
          background-color: ${isSelected ? '#3B82F6' : '#6B7280'};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      className: 'stop-icon',
      iconSize: [isSelected ? 16 : 10, isSelected ? 16 : 10],
      iconAnchor: [isSelected ? 8 : 5, isSelected ? 8 : 5],
    });
  };

  const visibleStops = selectedRoute
    ? stops // In a full implementation, filter by route
    : stops;

  return (
    <MapContainer
      center={[33.9519, -83.3576]} // UGA campus center
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapUpdater selectedStop={selectedStop} stops={stops} />

      {/* Render stops */}
      {visibleStops.map((stop) => (
        <Marker
          key={stop.stop_id}
          position={[stop.stop_lat, stop.stop_lon]}
          icon={createStopIcon(stop.stop_id === selectedStop)}
          eventHandlers={{
            click: () => onStopClick?.(stop),
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold">{stop.stop_name}</h3>
              {stop.stop_code && <p className="text-sm">Stop #{stop.stop_code}</p>}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Render vehicles */}
      {vehicles.map((vehicle) => {
        const route = routes.find(r => r.route_id === vehicle.route_id);

        return (
          <Marker
            key={vehicle.vehicle_id}
            position={[vehicle.latitude, vehicle.longitude]}
            icon={createBusIcon(route, vehicle.bearing)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">{vehicle.route_name}</h3>
                {vehicle.headsign && <p className="text-sm">{vehicle.headsign}</p>}
                {vehicle.occupancy_status && (
                  <p className="text-sm mt-1">
                    Occupancy: {vehicle.occupancy_status.replace(/_/g, ' ').toLowerCase()}
                  </p>
                )}
                {vehicle.speed !== undefined && (
                  <p className="text-xs text-gray-600">Speed: {Math.round(vehicle.speed * 2.237)} mph</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
