import AdmZip from 'adm-zip';
import { cacheQueries } from '../db/queries';
import type { GTFSRoute, GTFSStop, GTFSTrip, GTFSStopTime, GTFSShape } from './types';

const GTFS_STATIC_URL = process.env.GTFS_STATIC_URL || 'https://passio3.com/uga/passioTransit/gtfs/google_transit.zip';
const CACHE_TTL = 24 * 60 * 60; // 24 hours

function parseCSV<T>(csvText: string): T[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const results: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj: any = {};

    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });

    results.push(obj as T);
  }

  return results;
}

async function downloadGTFSZip(): Promise<AdmZip> {
  const response = await fetch(GTFS_STATIC_URL);
  if (!response.ok) {
    throw new Error(`Failed to download GTFS data: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  return new AdmZip(Buffer.from(buffer));
}

export async function loadGTFSStatic() {
  // Check cache first
  const cached = cacheQueries.get('gtfs_static_all');
  if (cached) {
    return cached;
  }

  console.log('Downloading GTFS static data...');
  const zip = await downloadGTFSZip();

  const data: any = {};

  // Parse routes.txt
  const routesEntry = zip.getEntry('routes.txt');
  if (routesEntry) {
    const routesText = routesEntry.getData().toString('utf8');
    data.routes = parseCSV<GTFSRoute>(routesText);
  }

  // Parse stops.txt
  const stopsEntry = zip.getEntry('stops.txt');
  if (stopsEntry) {
    const stopsText = stopsEntry.getData().toString('utf8');
    data.stops = parseCSV<GTFSStop>(stopsText).map(stop => ({
      ...stop,
      stop_lat: parseFloat(stop.stop_lat as any),
      stop_lon: parseFloat(stop.stop_lon as any)
    }));
  }

  // Parse trips.txt
  const tripsEntry = zip.getEntry('trips.txt');
  if (tripsEntry) {
    const tripsText = tripsEntry.getData().toString('utf8');
    data.trips = parseCSV<GTFSTrip>(tripsText);
  }

  // Parse stop_times.txt
  const stopTimesEntry = zip.getEntry('stop_times.txt');
  if (stopTimesEntry) {
    const stopTimesText = stopTimesEntry.getData().toString('utf8');
    data.stop_times = parseCSV<GTFSStopTime>(stopTimesText).map(st => ({
      ...st,
      stop_sequence: parseInt(st.stop_sequence as any, 10)
    }));
  }

  // Parse shapes.txt
  const shapesEntry = zip.getEntry('shapes.txt');
  if (shapesEntry) {
    const shapesText = shapesEntry.getData().toString('utf8');
    data.shapes = parseCSV<GTFSShape>(shapesText).map(shape => ({
      ...shape,
      shape_pt_lat: parseFloat(shape.shape_pt_lat as any),
      shape_pt_lon: parseFloat(shape.shape_pt_lon as any),
      shape_pt_sequence: parseInt(shape.shape_pt_sequence as any, 10)
    }));
  }

  // Cache the data
  cacheQueries.set('gtfs_static_all', data, CACHE_TTL);
  console.log('GTFS static data loaded and cached');

  return data;
}

export async function getRoutes(): Promise<GTFSRoute[]> {
  const data = await loadGTFSStatic();
  return data.routes || [];
}

export async function getStops(): Promise<GTFSStop[]> {
  const data = await loadGTFSStatic();
  return data.stops || [];
}

export async function getTrips(): Promise<GTFSTrip[]> {
  const data = await loadGTFSStatic();
  return data.trips || [];
}

export async function getStopTimes(): Promise<GTFSStopTime[]> {
  const data = await loadGTFSStatic();
  return data.stop_times || [];
}

export async function getShapes(): Promise<GTFSShape[]> {
  const data = await loadGTFSStatic();
  return data.shapes || [];
}

export async function getStopSchedule(stopId: string): Promise<GTFSStopTime[]> {
  const stopTimes = await getStopTimes();
  return stopTimes.filter(st => st.stop_id === stopId);
}

export async function getRouteShape(routeId: string): Promise<GTFSShape[]> {
  const trips = await getTrips();
  const shapes = await getShapes();

  const trip = trips.find(t => t.route_id === routeId && t.shape_id);
  if (!trip || !trip.shape_id) return [];

  return shapes
    .filter(s => s.shape_id === trip.shape_id)
    .sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
}
