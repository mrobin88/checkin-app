import { createClient } from '@supabase/supabase-js';

// These should be in .env file in production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Check if env vars are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ MISSING SUPABASE CONFIG:', {
    url: supabaseUrl ? '✅ Set' : '❌ Missing',
    key: supabaseAnonKey ? '✅ Set' : '❌ Missing',
  });
} else {
  console.log('✅ Supabase configured:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase Schema SQL
export const SCHEMA_SQL = `
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
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  geohash TEXT NOT NULL,
  
  -- Prevent spam
  CONSTRAINT unique_user_venue_time UNIQUE(user_id, venue_id, checked_in_at)
);

CREATE INDEX IF NOT EXISTS checkins_user_id_idx ON checkins(user_id);
CREATE INDEX IF NOT EXISTS checkins_venue_id_idx ON checkins(venue_id);
CREATE INDEX IF NOT EXISTS checkins_checked_in_at_idx ON checkins(checked_in_at DESC);
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
  checked_in_at TIMESTAMPTZ,
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
    c.checked_in_at,
    u.username,
    u.avatar_url,
    v.name as venue_name,
    v.category as venue_category
  FROM checkins c
  JOIN users u ON u.id = c.user_id
  JOIN venues v ON v.id = c.venue_id
  ORDER BY c.checked_in_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;
`;
