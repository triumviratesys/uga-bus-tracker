# Deployment Guide

## ✅ Application Ready to Deploy!

The UGA Bus Tracker is now fully functional without requiring any external API keys. Here's what's been set up:

## What's Working

### ✅ Core Features
- **Real-time bus tracking** with GTFS Realtime data
- **Interactive map** using Leaflet + OpenStreetMap (no API key needed!)
- **Stop schedules** with live arrival predictions
- **Bus occupancy visualization** with color-coded indicators
- **Route filtering** and selection
- **Favorites system** with SQLite database

### ✅ Advanced Features
- **Smart route planning** between any two stops
- **Dual prioritization** (Time vs Occupancy)
- **Auto-refreshing data** (10s for vehicles, 30s for schedules)
- **Persistent favorites** stored locally
- **Traffic estimation** using distance/time calculations

## Quick Start

The development server is already running at:
- **Local**: http://localhost:3000
- **Network**: http://10.255.255.254:3000

Just open your browser and navigate to http://localhost:3000

## Deployment Options

### Option 1: Vercel (Recommended - Free Tier)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts - Vercel will auto-detect Next.js

**Note**: The SQLite database will reset on each deployment. For production, consider using:
- Vercel Postgres
- PlanetScale
- Supabase

### Option 2: Docker

1. Create a Dockerfile:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

2. Build and run:
```bash
docker build -t uga-bus-tracker .
docker run -p 3000:3000 uga-bus-tracker
```

### Option 3: Traditional VPS (DigitalOcean, AWS EC2, etc.)

1. Clone repository on server
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Run with PM2:
```bash
npm i -g pm2
pm2 start npm --name "uga-bus-tracker" -- start
pm2 save
pm2 startup
```

## Environment Variables

The app works with default values, but you can customize in `.env.local`:

```env
PASSIO_SYSTEM_ID=3994
GTFS_STATIC_URL=https://passio3.com/uga/passioTransit/gtfs/google_transit.zip
GTFS_REALTIME_VEHICLES_URL=https://passio3.com/uga/passioTransit/gtfs/realtime/vehiclePositions
GTFS_REALTIME_TRIPS_URL=https://passio3.com/uga/passioTransit/gtfs/realtime/tripUpdates
GTFS_REALTIME_ALERTS_URL=https://passio3.com/uga/passioTransit/gtfs/realtime/serviceAlerts
REALTIME_REFRESH_INTERVAL=10000
STATIC_DATA_REFRESH_INTERVAL=86400000
```

## Database Considerations

### Development
- SQLite database is created automatically in `data/` directory
- Favorites and preferences persist locally

### Production
For production, consider migrating to a cloud database:

**Vercel Postgres:**
```bash
npm install @vercel/postgres
```

**PlanetScale:**
```bash
npm install @planetscale/database
```

Then update `lib/db/schema.ts` to use the new database client.

## Performance Optimization

### Build Optimization
```bash
npm run build
```

### Caching Strategy
- GTFS static data: Cached for 24 hours
- Real-time data: Refreshed every 10 seconds
- Route calculations: Cached per request

### CDN Assets
Leaflet CSS/images are loaded from CDN for optimal performance.

## Monitoring

Add these tools for production monitoring:

1. **Error Tracking**: Sentry
```bash
npm install @sentry/nextjs
```

2. **Analytics**: Vercel Analytics or Google Analytics

3. **Uptime Monitoring**: UptimeRobot or Pingdom

## Future Enhancements (When Google Maps is Available)

When you resolve the Google Maps API issue:

1. Install Google Maps loader:
```bash
npm install @googlemaps/js-api-loader
```

2. Add API key to `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

3. The traffic utilities in `lib/maps/traffic.ts` are already set up to use Google Maps APIs for:
   - Real-time traffic data
   - Enhanced route calculations
   - Distance Matrix API

## Testing

Run the test suite (when tests are added):
```bash
npm test
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Issues
```bash
# Delete and recreate database
rm -rf data/
# Restart app - database will be recreated
```

### GTFS Data Issues
```bash
# Clear cached GTFS data
# Database cache will auto-refresh after 24 hours
```

## Support

For issues or questions:
- Check the main README.md
- Review API documentation at `/api/*`
- Open an issue on GitHub

---

**Status**: ✅ Ready for deployment!
**Estimated Setup Time**: 5-10 minutes
**Cost**: $0 (with Vercel free tier)
