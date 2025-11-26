# Supabase Setup Guide

This guide walks you through setting up the Supabase backend for the CheckIn app.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in/up
2. Click "New Project"
3. Fill in:
   - **Name**: checkin-app (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is perfect for MVP

4. Wait 2-3 minutes for project creation

## Step 2: Get Your API Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGci...` (long JWT token)

3. Add them to your `.env` file:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...your-key-here
```

## Step 3: Run the Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire SQL schema below and paste it:

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  address TEXT,
  category TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  verified BOOLEAN DEFAULT FALSE,
  geohash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Geospatial index for fast queries
  location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  ) STORED
);

-- Create spatial index
CREATE INDEX IF NOT EXISTS venues_location_idx ON venues USING GIST(location);
CREATE INDEX IF NOT EXISTS venues_geohash_idx ON venues(geohash);

-- Check-ins table
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  comment TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  geohash TEXT NOT NULL,
  
  -- Prevent spam
  CONSTRAINT unique_user_venue_time UNIQUE(user_id, venue_id, timestamp)
);

CREATE INDEX IF NOT EXISTS checkins_user_id_idx ON checkins(user_id);
CREATE INDEX IF NOT EXISTS checkins_venue_id_idx ON checkins(venue_id);
CREATE INDEX IF NOT EXISTS checkins_timestamp_idx ON checkins(timestamp DESC);
CREATE INDEX IF NOT EXISTS checkins_geohash_idx ON checkins(geohash);

-- Friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_friendship UNIQUE(user_id, friend_id),
  CONSTRAINT no_self_friendship CHECK(user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS friendships_user_id_idx ON friendships(user_id);
CREATE INDEX IF NOT EXISTS friendships_friend_id_idx ON friendships(friend_id);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create venues" ON venues FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Anyone can view check-ins" ON checkins FOR SELECT USING (true);
CREATE POLICY "Users can create own check-ins" ON checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own check-ins" ON checkins FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view friendships" ON friendships FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);
CREATE POLICY "Users can create friendships" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete friendships" ON friendships FOR DELETE USING (auth.uid() = user_id);

-- Functions for nearby queries
CREATE OR REPLACE FUNCTION nearby_venues(user_lat DECIMAL, user_lng DECIMAL, radius_meters INTEGER DEFAULT 5000)
RETURNS TABLE(
  id UUID,
  name TEXT,
  lat DECIMAL,
  lng DECIMAL,
  address TEXT,
  category TEXT,
  verified BOOLEAN,
  geohash TEXT,
  distance_meters DOUBLE PRECISION,
  checkin_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.name,
    v.lat,
    v.lng,
    v.address,
    v.category,
    v.verified,
    v.geohash,
    ST_Distance(
      v.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)
    ) as distance_meters,
    COUNT(c.id) as checkin_count
  FROM venues v
  LEFT JOIN checkins c ON c.venue_id = v.id
  WHERE ST_DWithin(
    v.location,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326),
    radius_meters
  )
  GROUP BY v.id, v.name, v.lat, v.lng, v.address, v.category, v.verified, v.geohash, v.location
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get recent check-ins with user and venue info
CREATE OR REPLACE FUNCTION recent_checkins(limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  venue_id UUID,
  comment TEXT,
  timestamp TIMESTAMPTZ,
  username TEXT,
  avatar_url TEXT,
  venue_name TEXT,
  venue_category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.venue_id,
    c.comment,
    c.timestamp,
    u.username,
    u.avatar_url,
    v.name as venue_name,
    v.category as venue_category
  FROM checkins c
  JOIN users u ON u.id = c.user_id
  JOIN venues v ON v.id = c.venue_id
  ORDER BY c.timestamp DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;
```

4. Click **Run** or press `Ctrl/Cmd + Enter`
5. Verify success - you should see "Success. No rows returned"

## Step 4: Enable Real-time (Optional but Recommended)

1. Go to **Database** → **Replication**
2. Enable replication for:
   - `checkins` table
   - `venues` table
   - `users` table

This allows the app to receive real-time updates when users check in.

## Step 5: Set Up Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (enabled by default)
3. Optional: Enable social providers (Google, GitHub, etc.)

For MVP, we'll use email magic links:

```typescript
// In your app
await supabase.auth.signInWithOtp({
  email: 'user@example.com'
});
```

## Step 6: Add Sample Data (Optional)

Want to test with some data? Run this in SQL Editor:

```sql
-- Create a test user (you need to sign up in the app first, then update this)
-- Get your user ID from: SELECT id FROM auth.users;

-- Insert sample venues (replace 'your-user-id' with actual ID)
INSERT INTO venues (name, lat, lng, address, category, created_by, verified, geohash) VALUES
  ('Blue Bottle Coffee', 37.7749, -122.4194, '123 Market St, SF', 'coffee', 'your-user-id', true, '9q8yyk'),
  ('The Mission', 37.7599, -122.4148, '456 Mission St, SF', 'bar', 'your-user-id', true, '9q8yyy'),
  ('Golden Gate Park', 37.7694, -122.4862, 'Golden Gate Park, SF', 'outdoors', 'your-user-id', false, '9q8yy2');
```

## Step 7: Configure Storage (For Profile Pictures)

1. Go to **Storage**
2. Click "New Bucket"
3. Name it `avatars`
4. Set to **Public**
5. Add policy:

```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public access to avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
```

## Step 8: Test the Connection

In your app, try this code:

```typescript
import { supabase } from './lib/supabase';

// Test query
const { data, error } = await supabase
  .from('venues')
  .select('*')
  .limit(5);

console.log('Venues:', data);
console.log('Error:', error);
```

If you see venues (or an empty array with no error), you're connected! 🎉

## Troubleshooting

### "relation does not exist" error
- Make sure you ran the SQL schema
- Check that PostGIS extension is enabled
- Try refreshing the database schema

### "permission denied" error
- Check RLS policies are created
- Ensure you're authenticated when needed
- Verify anon key has correct permissions

### "function does not exist" error
- Make sure you ran the function definitions
- Check function names match exactly in your code

### Real-time not working
- Enable replication on tables
- Check websocket connection in Network tab
- Verify subscription code is correct

## Next Steps

1. ✅ Tables created
2. ✅ Functions defined
3. ✅ RLS policies active
4. ✅ Real-time enabled
5. 🚀 Start building!

Need help? Check the [Supabase docs](https://supabase.com/docs) or join their [Discord](https://discord.supabase.com).

