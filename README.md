# CheckIn

Social check-in app: discover places, share with friends, see trending spots.

---

## What do?

- **Check in** at real venues (from OpenStreetMap) and leave a short comment.
- **Activity feed** shows nearby and global check-ins; filter by distance.
- **Hot** tab shows trending spots by recent check-in count.
- **Profile**: stats, streaks, achievements, friends, saved venues; custom profile photo (upload overrides OAuth avatar).
- **Account**: sign in with Google; edit or delete your own posts; optional anonymous check-ins.
- **Business claims**: venue owners can submit a claim (pending approval).
- **PWA**: installable on mobile; works offline for basic use.

---

## How do?

### Run locally

1. **Env**  
   Create `.env` with:
   - `VITE_SUPABASE_URL` — your Supabase project URL  
   - `VITE_SUPABASE_ANON_KEY` — Supabase anon key  

2. **Database**  
   In Supabase: **SQL Editor** → paste all of `SCHEMA_SIMPLE.sql` → Run.  
   Then **Database → Replication**: enable Realtime for `messages` and `friendships`.

3. **Auth**  
   In Supabase: **Authentication → Providers** → enable Google; set redirect URL (e.g. `http://localhost:5173` for local).

4. **Start**  
   `npm install` then `npm run dev`. Open http://localhost:5173.

### Optional: profile photos

In Supabase **Storage**: create a public bucket named `avatars`. Add a policy so authenticated users can upload (e.g. path `{user_id}/*`). Then profile picture upload in the app works.

### Deploy

Build: `npm run build`. Deploy the `dist/` folder (e.g. Vercel). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host’s env; add your production URL to Supabase Auth redirect URLs.

---

## Project structure

```
checkin-app/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── SCHEMA_SIMPLE.sql          # Supabase schema (run once in SQL Editor)
├── public/                    # Static assets, PWA icons, manifest
└── src/
    ├── main.tsx               # Entry; wraps app in AuthProvider
    ├── App.tsx                # Shell: tabs (Nearby / Activity / Hot), modals, footer
    ├── index.css              # Tailwind + app styles
    ├── vite-env.d.ts
    ├── types/
    │   └── index.ts           # Venue, CheckIn, Message, User, etc.
    ├── contexts/
    │   └── AuthContext.tsx    # Auth state, profile avatar from DB, refreshProfile
    ├── hooks/
    │   ├── useGeolocation.ts
    │   └── usePullToRefresh.ts
    ├── lib/
    │   ├── supabase.ts        # Client + connection check
    │   ├── overpass.ts        # Fetch venues from OpenStreetMap (Overpass API)
    │   ├── geohash.ts
    │   ├── friends.ts         # Friends helpers (FriendsPageSimple uses DB directly)
    │   ├── notifications.ts   # Push / trending helpers
    │   └── antiSpoof.ts       # Location checks
    └── components/
        ├── Header.tsx
        ├── Map.tsx            # MapLibre + OSM tiles; venue markers
        ├── VenueList.tsx      # List under map
        ├── CheckInModal.tsx
        ├── ActivityFeed.tsx    # Distance filters, pull-to-refresh
        ├── CheckInCard.tsx    # One check-in; reply, like, edit/delete own
        ├── ReplyModal.tsx
        ├── TrendingSpots.tsx
        ├── AuthModal.tsx      # Google sign-in
        ├── ProfilePage.tsx    # Stats, avatar upload, friends, saved, settings
        ├── AboutModal.tsx
        ├── LikeButton.tsx
        ├── BookmarkButton.tsx
        ├── ShareButton.tsx
        ├── FriendsPageSimple.tsx
        ├── SavedVenues.tsx
        ├── SettingsPage.tsx
        ├── ClaimBusinessModal.tsx
        ├── InstallPrompt.tsx
        ├── QuickActions.tsx
        └── NotificationCenter.tsx
```

- **Data**: Supabase (Postgres) for users, messages (check-ins + replies), friendships, likes, bookmarks, venue_claims. Realtime for messages/friendships.
- **Venues**: OpenStreetMap via Overpass in `src/lib/overpass.ts` (no Foursquare/Google Places).
- **Maps**: MapLibre GL + OSM raster tiles in `Map.tsx`.

---

*AI/agent context is separate: see `agent-context/CONTEXT.md` (for agents only, not user or dev docs).*
