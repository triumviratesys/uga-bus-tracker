'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRoutes, useStops, useVehicles, useSchedule, useDirections, useFavorites } from '@/lib/hooks/useTransitData';
import OccupancyIndicator from '@/components/OccupancyIndicator/OccupancyIndicator';
import FavoriteButton from '@/components/FavoriteButton/FavoriteButton';

// Dynamically import Map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/Map/MapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center">Loading map...</div>
});

export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState<string>();
  const [selectedStop, setSelectedStop] = useState<string>();
  const [fromStop, setFromStop] = useState<string>();
  const [toStop, setToStop] = useState<string>();
  const [priorityMode, setPriorityMode] = useState<'time' | 'occupancy'>('time');
  const [showDirections, setShowDirections] = useState(false);

  const { data: routes, isLoading: routesLoading } = useRoutes();
  const { data: stops, isLoading: stopsLoading } = useStops();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles(selectedRoute);
  const { data: schedule } = useSchedule(selectedStop || '', selectedRoute);
  const { data: directions } = useDirections(fromStop, toStop, priorityMode);
  const { data: favorites, mutate: mutateFavorites } = useFavorites();

  const handleAddFavorite = async () => {
    if (!fromStop || !toStop) return;

    const fromStopData = stops?.find((s: any) => s.stop_id === fromStop);
    const toStopData = stops?.find((s: any) => s.stop_id === toStop);

    const name = `${fromStopData?.stop_name} → ${toStopData?.stop_name}`;

    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        from_stop_id: fromStop,
        to_stop_id: toStop,
        priority_mode: priorityMode
      })
    });

    mutateFavorites();
  };

  const handleRemoveFavorite = async (id: number) => {
    await fetch(`/api/favorites?id=${id}`, { method: 'DELETE' });
    mutateFavorites();
  };

  const isFavorited = favorites?.some((f: any) =>
    f.from_stop_id === fromStop && f.to_stop_id === toStop
  );

  const currentFavorite = favorites?.find((f: any) =>
    f.from_stop_id === fromStop && f.to_stop_id === toStop
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">UGA Bus Tracker</h1>
          <p className="text-sm text-gray-600 mt-1">Real-time bus tracking for UGA</p>
        </div>

        {/* Mode Toggle */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setShowDirections(false)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                !showDirections
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Map View
            </button>
            <button
              onClick={() => setShowDirections(true)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                showDirections
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Directions
            </button>
          </div>
        </div>

        {!showDirections ? (
          <>
            {/* Route Filter */}
            <div className="p-4 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Route
              </label>
              <select
                value={selectedRoute || ''}
                onChange={(e) => setSelectedRoute(e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Routes</option>
                {routes?.map((route: any) => (
                  <option key={route.route_id} value={route.route_id}>
                    {route.route_short_name || route.route_long_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Buses */}
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Active Buses {vehiclesLoading ? '...' : `(${vehicles?.length || 0})`}
              </h2>
              <div className="space-y-2">
                {vehicles?.map((vehicle: any) => (
                  <div
                    key={vehicle.vehicle_id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{vehicle.route_name}</p>
                        {vehicle.headsign && (
                          <p className="text-sm text-gray-600">{vehicle.headsign}</p>
                        )}
                      </div>
                      <OccupancyIndicator status={vehicle.occupancy_status} showLabel />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Stop Schedule */}
            {selectedStop && schedule && (
              <div className="p-4 border-t border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Schedule for {stops?.find((s: any) => s.stop_id === selectedStop)?.stop_name}
                </h2>
                <div className="space-y-2">
                  {schedule.schedule?.slice(0, 10).map((entry: any, idx: number) => {
                    const arrivalTime = new Date(entry.estimated_arrival);
                    const minutesUntil = Math.round((arrivalTime.getTime() - Date.now()) / 60000);

                    return (
                      <div key={idx} className="p-2 bg-gray-50 rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{entry.route_name}</span>
                          <span className={`text-sm ${minutesUntil < 5 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                            {minutesUntil < 1 ? 'Arriving' : `${minutesUntil} min`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Directions Panel */}
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Your Trip</h2>

              {/* From Stop */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                <select
                  value={fromStop || ''}
                  onChange={(e) => setFromStop(e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select stop...</option>
                  {stops?.map((stop: any) => (
                    <option key={stop.stop_id} value={stop.stop_id}>
                      {stop.stop_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Stop */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                <select
                  value={toStop || ''}
                  onChange={(e) => setToStop(e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select stop...</option>
                  {stops?.map((stop: any) => (
                    <option key={stop.stop_id} value={stop.stop_id}>
                      {stop.stop_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Mode */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioritize</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPriorityMode('time')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      priorityMode === 'time'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Time
                  </button>
                  <button
                    onClick={() => setPriorityMode('occupancy')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      priorityMode === 'occupancy'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Space
                  </button>
                </div>
              </div>

              {/* Favorite Button */}
              {fromStop && toStop && (
                <div className="mb-4 flex justify-end">
                  <FavoriteButton
                    isFavorite={!!isFavorited}
                    onToggle={async () => {
                      if (isFavorited && currentFavorite) {
                        await handleRemoveFavorite(currentFavorite.id);
                      } else {
                        await handleAddFavorite();
                      }
                    }}
                  />
                </div>
              )}

              {/* Results */}
              {directions && directions.options && (
                <div className="space-y-3 mt-6">
                  <h3 className="font-semibold text-gray-900">Available Routes</h3>
                  {directions.options.map((option: any, idx: number) => {
                    const waitMinutes = Math.round((option.estimated_arrival - Date.now()) / 60000);

                    return (
                      <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-blue-900">{option.route_name}</p>
                            <p className="text-sm text-blue-700">
                              {waitMinutes < 1 ? 'Arriving now' : `Arrives in ${waitMinutes} min`}
                            </p>
                          </div>
                          {idx === 0 && (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
                              Best
                            </span>
                          )}
                        </div>
                        <OccupancyIndicator status={option.occupancy_status} showLabel />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Favorites List */}
              {favorites && favorites.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Saved Routes</h3>
                  <div className="space-y-2">
                    {favorites.map((fav: any) => (
                      <div
                        key={fav.id}
                        className="p-2 bg-gray-50 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setFromStop(fav.from_stop_id);
                          setToStop(fav.to_stop_id);
                          setPriorityMode(fav.priority_mode);
                        }}
                      >
                        <span className="text-sm text-gray-700">{fav.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFavorite(fav.id);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapComponent
          vehicles={vehicles || []}
          stops={stops || []}
          routes={routes || []}
          selectedRoute={selectedRoute}
          selectedStop={selectedStop}
          onStopClick={(stop) => setSelectedStop(stop.stop_id)}
        />
      </div>
    </div>
  );
}
