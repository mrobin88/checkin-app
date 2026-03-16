# Agent context — for AI/client agents only

**Not for end users or general dev docs.** User and developer documentation is the project root **README.md**. Use this file only for agent context to save time.

## Stack

- **Frontend:** React 18, TypeScript, Vite 5, Tailwind, MapLibre GL (OSM tiles).
- **Backend:** Supabase (Postgres, Auth with Google, Realtime, Storage for avatars).
- **Venues:** OpenStreetMap only — `src/lib/overpass.ts` → Overpass API. No Foursquare/Google Places.

## Env

- `VITE_SUPABASE_URL` — Supabase project URL  
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key  
Optional: `VITE_MAPTILER_KEY` (maps; app works without it using OSM).

## Run

- `npm install` → `npm run dev` (http://localhost:5173).
- DB: run `SCHEMA_SIMPLE.sql` in Supabase SQL Editor once; enable Realtime for `messages`, `friendships`.
- Auth: enable Google in Supabase; redirect URL = app origin.
- Profile photos: Supabase Storage bucket `avatars` (public read, auth write).

## Key paths

| Purpose | Path |
|--------|------|
| App shell, tabs, feed state, edit/delete handlers | `src/App.tsx` |
| Auth + profile avatar from DB | `src/contexts/AuthContext.tsx` |
| Supabase client | `src/lib/supabase.ts` |
| Fetch nearby venues (OSM) | `src/lib/overpass.ts` |
| Map + markers | `src/components/Map.tsx` |
| Feed, filters, pull-to-refresh | `src/components/ActivityFeed.tsx` |
| Single post, reply/like/edit/delete | `src/components/CheckInCard.tsx` |
| Profile, avatar upload, stats, friends | `src/components/ProfilePage.tsx` |
| Types (Venue, CheckIn, Message, User…) | `src/types/index.ts` |
| Schema (users, messages, friendships, likes, bookmarks, venue_claims) | `SCHEMA_SIMPLE.sql` |

## Conventions

- Check-ins are **messages** with `parent_message_id` null; replies have it set. RLS: anyone read/insert; update/delete only own (`user_id` = `auth.uid()::text`).
- Profile avatar: `users.avatar_url` overrides OAuth; AuthContext exposes `profileAvatarUrl` and `refreshProfile()`.
- Venue IDs from Overpass: `osm-{type}-{id}`. Stored in `messages.venue_id` (and similar) as text.

## Common tasks

- **Add a Supabase table/column:** update `SCHEMA_SIMPLE.sql` and document in this file.
- **Change venue source:** replace or extend `src/lib/overpass.ts` and call site in `App.tsx` (fetchNearbyVenues).
- **New env var:** add to `.env.example` and this file; use `import.meta.env.VITE_*` in app.
