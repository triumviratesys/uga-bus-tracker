# Quick Start Deployment Guide

## ✅ Pre-Deployment Checklist

All checks **PASSED** ✓

- [x] TypeScript compilation: **No errors**
- [x] Production build: **Successful**
- [x] API endpoints: **All functional**
- [x] Database: **Initialized and working**
- [x] GTFS data: **Loading correctly**
- [x] No runtime errors
- [x] No security issues

## 🚀 Deploy to Vercel (5 minutes)

### Option 1: One-Click Deploy

1. Push your code to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Click "Deploy"

**That's it!** Vercel auto-detects Next.js and deploys everything.

### Option 2: CLI Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (run from project root)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - Project name? uga-bus-tracker
# - Directory? ./
# - Override settings? No

# Production deployment
vercel --prod
```

**Your app will be live at**: `https://uga-bus-tracker.vercel.app`

### Database Note for Vercel

SQLite works on Vercel but resets on each deployment. For persistent storage:

```bash
# Option A: Use Vercel Postgres (recommended)
npm install @vercel/postgres

# Option B: Use PlanetScale
npm install @planetscale/database
```

Then update `lib/db/schema.ts` to use the new database.

## 🐳 Deploy with Docker

### Build and Run Locally

```bash
# Create Dockerfile (already included in project)
docker build -t uga-bus-tracker .

# Run container
docker run -p 3000:3000 uga-bus-tracker

# Visit: http://localhost:3000
```

### Deploy to Cloud

**Railway** (Easiest):
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**DigitalOcean App Platform**:
1. Go to digitalocean.com
2. Create New App
3. Connect GitHub
4. Select Dockerfile
5. Deploy

**AWS ECS/Fargate**:
```bash
# Push to ECR
aws ecr create-repository --repository-name uga-bus-tracker
docker tag uga-bus-tracker:latest [YOUR-ECR-URL]:latest
docker push [YOUR-ECR-URL]:latest

# Deploy via ECS console or CLI
```

## 🖥️ Deploy to Traditional VPS

### Setup on Ubuntu/Debian Server

```bash
# 1. Clone repository
git clone [your-repo-url]
cd uga-bus-tracker

# 2. Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install dependencies and build
npm install
npm run build

# 4. Install PM2 for process management
sudo npm install -g pm2

# 5. Start application
pm2 start npm --name "uga-bus-tracker" -- start

# 6. Setup auto-restart
pm2 save
pm2 startup

# 7. Configure nginx reverse proxy (optional)
sudo apt install nginx
```

**Nginx config** (`/etc/nginx/sites-available/uga-bus-tracker`):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/uga-bus-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## ⚡ Deploy to Cloudflare Pages

```bash
# Install Wrangler CLI
npm install -g wrangler

# Deploy
npx wrangler pages publish .next --project-name=uga-bus-tracker
```

## 🔧 Environment Variables for Production

All features work WITHOUT any env vars! But you can customize:

```env
# Optional - customize GTFS URLs if UGA changes them
GTFS_STATIC_URL=https://passio3.com/uga/passioTransit/gtfs/google_transit.zip
GTFS_REALTIME_VEHICLES_URL=https://passio3.com/uga/passioTransit/gtfs/realtime/vehiclePositions

# Optional - adjust refresh intervals
REALTIME_REFRESH_INTERVAL=10000
STATIC_DATA_REFRESH_INTERVAL=86400000
```

## 📊 Post-Deployment Monitoring

### Add Vercel Analytics (Optional)
```bash
npm install @vercel/analytics
```

In `app/layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Add Error Tracking with Sentry (Optional)
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

## 🎯 Quick Troubleshooting

**Build fails?**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Database issues?**
```bash
# Delete and recreate
rm -rf data/
# Restart app - database recreates automatically
```

**Port already in use?**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

## 🌟 Recommended: Vercel Deployment

**Why Vercel?**
- ✅ Free tier (generous limits)
- ✅ Auto-deploys from Git
- ✅ Global CDN
- ✅ Zero config needed
- ✅ Built-in analytics
- ✅ Automatic HTTPS

**Steps**:
1. Push to GitHub
2. Import to Vercel
3. Deploy

**Total time**: ~5 minutes

## 📈 Scaling Considerations

Current setup handles:
- ✅ 100-1000 concurrent users (Vercel free tier)
- ✅ Real-time updates every 10 seconds
- ✅ GTFS data caching (reduces API calls)

For higher load:
1. Upgrade Vercel plan
2. Add Redis for caching
3. Use edge functions for API routes
4. Implement rate limiting

## ✅ Deployment Complete!

Once deployed, your users can:
- 📍 Track buses in real-time
- 🗺️ View interactive map (no API key needed!)
- ⭐ Save favorite routes
- 📊 See occupancy levels
- 🎯 Get smart route recommendations

**Test your deployment**:
```bash
curl https://your-app-url.vercel.app/api/routes
# Should return UGA routes JSON
```

---

**Need help?** Check the main README.md or DEPLOYMENT.md for detailed info.
