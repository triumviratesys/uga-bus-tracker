import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import type { VehiclePosition, TripUpdate, ServiceAlert } from './types';

const VEHICLES_URL = process.env.GTFS_REALTIME_VEHICLES_URL || 'https://passio3.com/uga/passioTransit/gtfs/realtime/vehiclePositions';
const TRIPS_URL = process.env.GTFS_REALTIME_TRIPS_URL || 'https://passio3.com/uga/passioTransit/gtfs/realtime/tripUpdates';
const ALERTS_URL = process.env.GTFS_REALTIME_ALERTS_URL || 'https://passio3.com/uga/passioTransit/gtfs/realtime/serviceAlerts';

async function fetchProtobuf(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch GTFS Realtime data: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function getVehiclePositions(): Promise<VehiclePosition[]> {
  try {
    const buffer = await fetchProtobuf(VEHICLES_URL);
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);

    const vehicles: VehiclePosition[] = [];

    for (const entity of feed.entity) {
      if (entity.vehicle) {
        const vehicle = entity.vehicle;
        const position = vehicle.position;
        const trip = vehicle.trip;

        if (position && trip) {
          const occupancyMap: any = {
            0: 'EMPTY',
            1: 'MANY_SEATS_AVAILABLE',
            2: 'FEW_SEATS_AVAILABLE',
            3: 'STANDING_ROOM_ONLY',
            4: 'CRUSHED_STANDING_ROOM_ONLY',
            5: 'FULL',
            6: 'NOT_ACCEPTING_PASSENGERS'
          };

          vehicles.push({
            vehicle_id: vehicle.vehicle?.id || entity.id,
            route_id: trip.routeId || '',
            trip_id: trip.tripId || '',
            latitude: position.latitude,
            longitude: position.longitude,
            bearing: position.bearing ?? undefined,
            speed: position.speed ?? undefined,
            timestamp: typeof vehicle.timestamp === 'number' ? vehicle.timestamp : (vehicle.timestamp as any)?.toNumber?.() || Date.now() / 1000,
            current_stop_sequence: vehicle.currentStopSequence ?? undefined,
            current_status: vehicle.currentStatus?.toString(),
            occupancy_status: vehicle.occupancyStatus ? occupancyMap[vehicle.occupancyStatus] : undefined
          });
        }
      }
    }

    return vehicles;
  } catch (error) {
    console.error('Error fetching vehicle positions:', error);
    return [];
  }
}

export async function getTripUpdates(): Promise<TripUpdate[]> {
  try {
    const buffer = await fetchProtobuf(TRIPS_URL);
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);

    const tripUpdates: TripUpdate[] = [];

    for (const entity of feed.entity) {
      if (entity.tripUpdate) {
        const tripUpdate = entity.tripUpdate;
        const trip = tripUpdate.trip;

        if (trip) {
          tripUpdates.push({
            trip_id: trip.tripId || '',
            route_id: trip.routeId || '',
            timestamp: typeof tripUpdate.timestamp === 'number' ? tripUpdate.timestamp : (tripUpdate.timestamp as any)?.toNumber?.() || Date.now() / 1000,
            stop_time_updates: (tripUpdate.stopTimeUpdate || []).map(stu => ({
              stop_sequence: stu.stopSequence || 0,
              stop_id: stu.stopId || '',
              arrival: stu.arrival ? {
                delay: stu.arrival.delay ?? undefined,
                time: typeof stu.arrival.time === 'number' ? stu.arrival.time : (stu.arrival.time as any)?.toNumber?.(),
                uncertainty: stu.arrival.uncertainty ?? undefined
              } : undefined,
              departure: stu.departure ? {
                delay: stu.departure.delay ?? undefined,
                time: typeof stu.departure.time === 'number' ? stu.departure.time : (stu.departure.time as any)?.toNumber?.(),
                uncertainty: stu.departure.uncertainty ?? undefined
              } : undefined
            }))
          });
        }
      }
    }

    return tripUpdates;
  } catch (error) {
    console.error('Error fetching trip updates:', error);
    return [];
  }
}

export async function getServiceAlerts(): Promise<ServiceAlert[]> {
  try {
    const buffer = await fetchProtobuf(ALERTS_URL);
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);

    const alerts: ServiceAlert[] = [];

    for (const entity of feed.entity) {
      if (entity.alert) {
        const alert = entity.alert;

        alerts.push({
          id: entity.id,
          header_text: alert.headerText?.translation?.[0]?.text || '',
          description_text: alert.descriptionText?.translation?.[0]?.text || '',
          informed_entities: (alert.informedEntity || []).map(ie => ({
            route_id: ie.routeId ?? undefined,
            stop_id: ie.stopId ?? undefined,
            trip_id: ie.trip?.tripId ?? undefined
          })),
          start_time: typeof alert.activePeriod?.[0]?.start === 'number' ? alert.activePeriod[0].start : (alert.activePeriod?.[0]?.start as any)?.toNumber?.(),
          end_time: typeof alert.activePeriod?.[0]?.end === 'number' ? alert.activePeriod[0].end : (alert.activePeriod?.[0]?.end as any)?.toNumber?.()
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error fetching service alerts:', error);
    return [];
  }
}

// Get vehicles with route information enriched
export async function getEnrichedVehicles() {
  const vehicles = await getVehiclePositions();
  const { getRoutes, getTrips } = await import('./static-loader');

  const routes = await getRoutes();
  const trips = await getTrips();

  return vehicles.map(vehicle => {
    const route = routes.find(r => r.route_id === vehicle.route_id);
    const trip = trips.find(t => t.trip_id === vehicle.trip_id);

    return {
      ...vehicle,
      route_name: route?.route_short_name || route?.route_long_name || vehicle.route_id,
      route_color: route?.route_color,
      headsign: trip?.trip_headsign
    };
  });
}
