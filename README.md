# UGA Bus Tracker

A comprehensive real-time bus tracking application for the University of Georgia, featuring advanced route planning, occupancy visualization, and personalized favorites.

## Features

### Core Features
- **Real-time Bus Tracking**: See all active buses on an interactive map with live position updates
- **Route Visualization**: View route lines and all stops for specific bus routes
- **Stop Schedules**: Get real-time arrival predictions for any bus stop
- **Bus Occupancy**: See how crowded each bus is before boarding

### Advanced Features
- **Smart Route Planning**: Find the best route between any two stops
- **Dual Prioritization Modes**:
  - **Time Priority**: Get to your destination fastest
  - **Occupancy Priority**: Find buses with the most available space
- **Favorites System**: Save your frequent routes for quick access
- **Real-time Updates**: Schedules automatically adjust based on:
  - Live vehicle positions (GTFS Realtime)
  - Trip delays and updates
  - Basic traffic estimation (distance/time calculations)

## Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS 4
- **Maps**: Leaflet with OpenStreetMap (no API key required!)
- **Data Sources**:
  - GTFS Static (routes, stops, schedules)
  - GTFS Realtime (vehicle positions, trip updates, alerts)
- **Database**: SQLite with Better-SQLite3
- **Real-time Updates**: SWR for data fetching and caching

## Getting Started

### Prerequisites

- Node.js 20 or higher
- No API keys required! 🎉

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd uga-bus-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Map View
- View all active buses in real-time
- Filter by specific routes
- Click on stops to see upcoming arrivals
- Click on buses to see route and occupancy information

### Directions
1. Select your starting stop (From)
2. Select your destination stop (To)
3. Choose your priority:
   - **Time**: Fastest route
   - **Space**: Route with most available seating
4. View ranked route options with:
   - Arrival times
   - Occupancy levels
   - Estimated wait times

### Favorites
- Click the star icon when planning a route to save it
- Access saved routes from the Favorites section
- Click any favorite to quickly load that route

## API Endpoints

### Routes
- `GET /api/routes` - Get all bus routes
- `GET /api/routes?route_id={id}` - Get specific route with shape

### Stops
- `GET /api/stops` - Get all bus stops
- `GET /api/stops?stop_id={id}` - Get specific stop with schedule

### Vehicles
- `GET /api/vehicles` - Get all active vehicles
- `GET /api/vehicles?route_id={id}` - Get vehicles for specific route

### Schedule
- `GET /api/schedule?stop_id={id}` - Get schedule for a stop
- `GET /api/schedule?stop_id={id}&route_id={route}` - Filter by route

### Directions
- `GET /api/directions?from={stop1}&to={stop2}` - Get route options
- `GET /api/directions?from={stop1}&to={stop2}&priority=occupancy` - Prioritize by space

### Favorites
- `GET /api/favorites` - Get all saved favorites
- `POST /api/favorites` - Create a new favorite
- `PUT /api/favorites` - Update a favorite
- `DELETE /api/favorites?id={id}` - Delete a favorite

## Data Sources

### UGA Passio Transit System
- System ID: 3994
- GTFS Static Feed: `https://passio3.com/uga/passioTransit/gtfs/google_transit.zip`
- GTFS Realtime Feeds:
  - Vehicle Positions: `https://passio3.com/uga/passioTransit/gtfs/realtime/vehiclePositions`
  - Trip Updates: `https://passio3.com/uga/passioTransit/gtfs/realtime/tripUpdates`
  - Service Alerts: `https://passio3.com/uga/passioTransit/gtfs/realtime/serviceAlerts`

## Project Structure

```
uga-bus-tracker/
├── app/
│   ├── api/              # API route handlers
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main application page
├── components/
│   ├── Map/              # Map component
│   ├── OccupancyIndicator/  # Bus occupancy display
│   └── FavoriteButton/   # Favorite toggle button
├── lib/
│   ├── db/               # Database schema and queries
│   ├── gtfs/             # GTFS data parsers
│   ├── maps/             # Google Maps integration
│   ├── hooks/            # React hooks for data fetching
│   └── utils/            # Utility functions (prioritization, etc.)
└── data/                 # SQLite database (auto-generated)
```

## Development

### Adding New Features

1. **New API Routes**: Add to `app/api/[feature]/route.ts`
2. **New Components**: Add to `components/[ComponentName]/`
3. **Data Hooks**: Add to `lib/hooks/useTransitData.ts`
4. **GTFS Processing**: Extend `lib/gtfs/static-loader.ts` or `realtime-loader.ts`

### Database

The SQLite database is automatically initialized on first run. It includes:
- User favorites
- User preferences
- GTFS data cache

Location: `data/uga-bus-tracker.db`

## License

MIT License - See LICENSE file for details

## Future Enhancements

- Google Maps integration for enhanced traffic data (when API access is available)
- Push notifications for favorite routes
- Historical data and analytics
- Multi-campus support

## Acknowledgments

- UGA Transportation & Parking Services
- Passio Technologies for transit data
- OpenStreetMap contributors
- Leaflet mapping library
- GTFS specification maintainers
