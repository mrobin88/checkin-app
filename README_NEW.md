# CheckIn - Social Location App 📍

> **Share places, connect with friends, discover local hotspots**

A modern, lightweight check-in app built with React, TypeScript, and Supabase. Think Foursquare meets modern UX.

---

## 🎯 Core Features

### For Users:
- 📍 **Check in** at real places (OpenStreetMap data)
- 👥 **Add friends** instantly (no approval needed)
- 🔥 **See trending spots** with recent activity  
- 💬 **Comment & reply** to check-ins
- 🗺️ **Interactive map** showing nearby venues
- 📱 **PWA support** - install on phone like a native app

### For Business Owners:
- 🏢 **Claim your venue** with one click
- 📊 **Get notified** of customer check-ins
- 💰 **Upgrade later** for analytics & deals (coming soon)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

**Create project:**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy your project URL and anon key

**Add to `.env`:**
```env
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Run database schema:**
1. Open Supabase SQL Editor
2. Copy contents of `SCHEMA_SIMPLE.sql`
3. Paste and click **Run**

**Enable Realtime:**
- Go to Database → Replication
- Toggle ON for: `messages`, `friendships`

### 3. Configure Google OAuth

In Supabase Dashboard:
1. Authentication → Providers → Google
2. Enable Google
3. Add authorized redirect: `https://yourproject.supabase.co/auth/v1/callback`

### 4. Run App
```bash
npm run dev
```

Open http://localhost:5173

---

## 📁 Project Structure

```
checkin-app/
├── src/
│   ├── components/          # UI components
│   │   ├── FriendsPageSimple.tsx    # Friend management
│   │   ├── ClaimBusinessModal.tsx   # Business claims
│   │   ├── CheckInModal.tsx         # Check-in form
│   │   ├── ActivityFeed.tsx         # Feed with filters
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.ts      # Database client (35 lines!)
│   │   ├── geohash.ts       # Location indexing
│   │   └── overpass.ts      # OpenStreetMap API
│   └── types/
│       └── index.ts         # TypeScript types
├── public/
│   ├── sw.js                # Service worker for PWA
│   └── manifest.webmanifest # PWA manifest
├── SCHEMA_SIMPLE.sql        # Database setup
└── FINAL_SETUP_GUIDE.md     # Full documentation
```

---

## 🎨 Tech Stack

| What | Technology | Why |
|------|-----------|-----|
| **Frontend** | React + TypeScript | Type safety, component reuse |
| **Styling** | Tailwind CSS | Fast development, mobile-first |
| **Database** | Supabase (PostgreSQL) | Real-time, auth, storage |
| **Maps** | MapLibre GL + OpenStreetMap | Free, no API keys needed |
| **Location** | Geohashes | Simple, fast, no PostGIS |
| **Build** | Vite | Fast HMR, optimized builds |
| **PWA** | Vite PWA Plugin | Auto-generates service worker |

**Total dependencies:** 6 production, 10 dev (all necessary)

---

## 💼 Business Model

### Revenue Streams:

1. **Business Subscriptions** ($29/mo)
   - Claim venue
   - Analytics dashboard
   - Post deals & specials
   - Respond to check-ins

2. **Premium Users** ($4.99/mo)
   - Ad-free experience
   - Custom badges
   - Extended history
   - Priority support

3. **Sponsored Venues** ($99/mo)
   - Featured in search
   - Highlighted on map
   - "Sponsored" badge

4. **Event Promotions** ($49/event)
   - Promote special events
   - Show in feed
   - Send to nearby users

### Cost Structure:
- Supabase: Free (up to 500MB, 50k monthly active users)
- Hosting: $0 (Vercel free tier)
- Maps: Free (OpenStreetMap)
- OAuth: Free (Supabase built-in)

**Profit margin: ~95% after first 1,000 users**

---

## 📈 Growth Strategy

### Month 1: Launch Locally
- Target: Your city/neighborhood
- Tactics: Personal invites, local Facebook groups
- Goal: 100 active users

### Month 2: Business Partnerships
- Contact 10 local businesses
- Offer free claims
- Ask them to promote to customers
- Goal: 500 users, 10 claimed businesses

### Month 3: Expand
- Add nearby cities
- Partner with food bloggers
- Post on Product Hunt
- Goal: 2,000 users

### Month 4: Monetize
- Launch business subscriptions
- First revenue!

---

## 🔐 Security & Privacy

- ✅ Row-level security (RLS) on all tables
- ✅ OAuth authentication (no passwords stored)
- ✅ Anonymous check-ins supported
- ✅ Users can delete their data
- ✅ HTTPS only (enforced by Supabase)

---

## 📱 PWA Installation

### iOS (Safari):
1. Open app in Safari
2. Tap Share button
3. "Add to Home Screen"

### Android (Chrome):
1. Open app in Chrome
2. Tap menu (⋮)
3. "Install app" or "Add to Home screen"

### Desktop (Chrome/Edge):
- Install button appears in address bar

---

## 🆘 Troubleshooting

### "Failed to load venues"
- Check browser console for errors
- Verify internet connection
- Allow location permissions

### "Can't check in"
- Must be within 500m of venue
- Allow location access
- Sign in (anonymous check-ins have limits)

### "Friends not loading"
- Run `SCHEMA_SIMPLE.sql` in Supabase
- Enable Realtime on `friendships` table
- Check browser console

### Database errors:
- Read `FINAL_SETUP_GUIDE.md`
- Use `SCHEMA_SIMPLE.sql` (not old SCHEMA.sql)
- If still broken, drop all tables and start fresh

---

## 🤝 Contributing

This is a commercial project, but open to feedback:
- Report bugs via Issues
- Suggest features
- Share your success stories!

---

## 📄 License

MIT License - See LICENSE file

---

## 📧 Contact

**Business Inquiries:**
- Email: ratthewrobin@gmail.com
- For venue partnerships, advertising, or investment

**Support:**
- Check `FINAL_SETUP_GUIDE.md`
- GitHub Issues for bugs

---

**Made with ❤️ for local explorers**

*Start checking in and building your network today!*

