# CheckIn - Social Location Check-In App

A modern, PWA-first social check-in app built with React, Vite, and Supabase. Discover places, check in, and share your experiences with friends.

## ✨ Features

- 📍 **Real-time Location Tracking** - HTML5 Geolocation API for precise positioning
- 🗺️ **Interactive Maps** - MapLibre GL for beautiful, free maps
- 🔒 **Anti-Spoofing** - Rate limiting, velocity checks, and geohash verification
- 📱 **PWA Ready** - Works offline, installable on mobile devices
- 🚀 **Lightning Fast** - Built with Vite for instant hot reload
- 🎨 **iOS-Inspired Design** - Clean, modern UI with Tailwind CSS
- 🔄 **Real-time Updates** - Supabase subscriptions for live check-ins

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **MapLibre GL** - Free, open-source maps
- **Lucide React** - Beautiful icons

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL with PostGIS for geospatial queries
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Edge Functions

### Architecture
- Progressive Web App (PWA)
- Offline-first design
- Geohash-based proximity queries
- Client-side anti-spoofing validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (free tier)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/checkin-app.git
cd checkin-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**

Create a new project at [supabase.com](https://supabase.com)

Run the SQL schema from `src/lib/supabase.ts`:
- Go to your Supabase project dashboard
- Navigate to SQL Editor
- Copy and paste the `SCHEMA_SQL` from the file
- Execute the query

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

5. **Start the development server**
```bash
npm run dev
```

Visit `http://localhost:5173` 🎉

## 📱 Building for Production

### PWA Build
```bash
npm run build
npm run preview
```

The app is automatically configured as a PWA with:
- Service worker for offline support
- Web manifest for install prompts
- Asset caching for fast loads

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## 🗄️ Database Schema

### Tables

**users**
- Extends Supabase auth.users
- Stores username, avatar_url

**venues**
- Places where users can check in
- Includes geospatial data (lat, lng, geohash)
- Category, verification status

**checkins**
- User check-ins at venues
- Comments, timestamps
- Linked to users and venues

**friendships**
- Social connections between users

### Functions

**nearby_venues(lat, lng, radius)**
- Returns venues within radius (default 5km)
- Orders by distance
- Includes check-in counts

**recent_checkins(limit)**
- Returns recent check-ins with user/venue info
- Joins across tables for efficiency

## 🔒 Security Features

### Anti-Spoofing
- **Rate Limiting**: Max 5 check-ins per hour
- **Velocity Checks**: Prevents impossible travel speeds
- **Geohash Verification**: Users must be within 100m of venue
- **Social Proof**: Show check-in counts to identify fake venues

### Privacy
- Row Level Security (RLS) on all tables
- Users control their own data
- Location data only shared when checking in

## 🎨 Customization

### Venue Categories
Edit `src/types/index.ts` to add/remove categories:
```typescript
export const VENUE_CATEGORIES = [
  { id: 'coffee', name: 'Coffee Shop', icon: '☕' },
  // Add your own...
];
```

### Map Style
Change map provider in `src/components/Map.tsx`:
```typescript
style: 'https://demotiles.maplibre.org/style.json'
// Or use MapTiler: `https://api.maptiler.com/maps/streets/style.json?key=${YOUR_KEY}`
```

### Theme Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: {
    500: '#3b82f6', // Change to your brand color
  }
}
```

## 📊 Scaling Considerations

### Free Tier Limits (First 10K Users)
- Supabase: 500MB database, 2GB bandwidth/month
- MapLibre: Unlimited (open source)
- Vercel: 100GB bandwidth/month

### When to Upgrade
- 100K+ users → Supabase Pro ($25/mo)
- Heavy map usage → MapTiler ($49/mo for 100K loads)

### Performance Optimization
- Geohash indexing for fast proximity queries
- Materialized views for popular venues
- CDN caching for static assets
- Connection pooling for database

## 🛣️ Roadmap

### Phase 1 - MVP (Current)
- [x] Core check-in functionality
- [x] Map with venue markers
- [x] Activity feed
- [x] Anti-spoofing measures

### Phase 2 - Social (Week 3-4)
- [ ] Friend connections
- [ ] User profiles
- [ ] Follow/unfollow
- [ ] Notifications

### Phase 3 - Gamification (Week 5-6)
- [ ] Leaderboards
- [ ] "Mayor" badges for most check-ins
- [ ] Achievements
- [ ] Venue recommendations

### Phase 4 - Native Apps (Month 2)
- [ ] Capacitor integration
- [ ] iOS App Store submission
- [ ] Android Play Store submission
- [ ] Push notifications

### Phase 5 - Business Features
- [ ] Venue claiming by businesses
- [ ] Business analytics dashboard
- [ ] Promotions and deals
- [ ] Verified business badges

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- MapLibre for free, open-source maps
- Supabase for amazing backend infrastructure
- Overture Maps for open venue data
- The Foursquare team for inspiring this project

## 💬 Support

- 📧 Email: support@checkinapp.com
- 🐦 Twitter: [@checkinapp](https://twitter.com/checkinapp)
- 💬 Discord: [Join our community](https://discord.gg/checkinapp)

---

Built with ❤️ by developers who miss the old Foursquare

