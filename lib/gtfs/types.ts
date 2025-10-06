// GTFS Static Data Types
export interface GTFSRoute {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: string;
  route_color?: string;
  route_text_color?: string;
}

export interface GTFSStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  stop_code?: string;
  stop_desc?: string;
}

export interface GTFSTrip {
  trip_id: string;
  route_id: string;
  service_id: string;
  trip_headsign?: string;
  direction_id?: string;
  shape_id?: string;
}

export interface GTFSStopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
  pickup_type?: string;
  drop_off_type?: string;
}

export interface GTFSShape {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
}

// GTFS Realtime Types
export interface VehiclePosition {
  vehicle_id: string;
  route_id: string;
  trip_id: string;
  latitude: number;
  longitude: number;
  bearing?: number;
  speed?: number;
  timestamp: number;
  current_stop_sequence?: number;
  current_status?: string;
  occupancy_status?: 'EMPTY' | 'MANY_SEATS_AVAILABLE' | 'FEW_SEATS_AVAILABLE' | 'STANDING_ROOM_ONLY' | 'CRUSHED_STANDING_ROOM_ONLY' | 'FULL' | 'NOT_ACCEPTING_PASSENGERS';
}

export interface TripUpdate {
  trip_id: string;
  route_id: string;
  stop_time_updates: StopTimeUpdate[];
  timestamp: number;
}

export interface StopTimeUpdate {
  stop_sequence: number;
  stop_id: string;
  arrival?: TimeEvent;
  departure?: TimeEvent;
}

export interface TimeEvent {
  delay?: number; // In seconds
  time?: number; // Unix timestamp
  uncertainty?: number;
}

export interface ServiceAlert {
  id: string;
  header_text: string;
  description_text?: string;
  informed_entities: InformedEntity[];
  start_time?: number;
  end_time?: number;
}

export interface InformedEntity {
  route_id?: string;
  stop_id?: string;
  trip_id?: string;
}

// Application-specific types
export interface EnrichedVehicle extends VehiclePosition {
  route_name: string;
  route_color?: string;
  headsign?: string;
}

export interface ScheduleEntry {
  stop_id: string;
  stop_name: string;
  route_id: string;
  route_name: string;
  scheduled_arrival: string;
  estimated_arrival?: number; // Unix timestamp with real-time adjustments
  delay?: number; // In seconds
  occupancy_status?: VehiclePosition['occupancy_status'];
}
