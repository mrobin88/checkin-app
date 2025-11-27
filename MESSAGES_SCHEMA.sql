-- ============================================
-- MESSAGES PERSISTENCE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Messages table (replaces check-ins with comment field)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL, -- Store venue ID from OpenStreetMap
  venue_name TEXT NOT NULL,
  venue_category TEXT,
  venue_lat DECIMAL(10, 8),
  venue_lng DECIMAL(11, 8),
  venue_address TEXT,
  
  -- User info (supports anonymous)
  user_id TEXT NOT NULL, -- Can be 'anonymous' or Supabase auth UUID
  username TEXT NOT NULL,
  avatar_url TEXT,
  
  -- Message content
  content TEXT NOT NULL,
  
  -- Metadata
  geohash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- For future moderation
  is_deleted BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT message_not_empty CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 2000)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_venue_id ON messages(venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_active ON messages(venue_id) WHERE is_deleted = FALSE;

-- Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read active messages
CREATE POLICY "Anyone can view active messages" ON messages
  FOR SELECT USING (is_deleted = FALSE);

-- Anyone can insert messages (anonymous or authenticated)
CREATE POLICY "Anyone can create messages" ON messages
  FOR INSERT WITH CHECK (true);

-- Users can only update their own messages
CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (
    user_id != 'anonymous' AND 
    user_id::uuid = auth.uid()
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Create function to get messages for a venue
CREATE OR REPLACE FUNCTION get_venue_messages(
  p_venue_id TEXT,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
  id UUID,
  venue_id TEXT,
  venue_name TEXT,
  venue_category TEXT,
  venue_lat DECIMAL,
  venue_lng DECIMAL,
  venue_address TEXT,
  user_id TEXT,
  username TEXT,
  avatar_url TEXT,
  content TEXT,
  geohash TEXT,
  created_at TIMESTAMPTZ,
  is_deleted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.venue_id,
    m.venue_name,
    m.venue_category,
    m.venue_lat,
    m.venue_lng,
    m.venue_address,
    m.user_id,
    m.username,
    m.avatar_url,
    m.content,
    m.geohash,
    m.created_at,
    m.is_deleted
  FROM messages m
  WHERE m.venue_id = p_venue_id
    AND m.is_deleted = FALSE
  ORDER BY m.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to get recent messages (global feed)
CREATE OR REPLACE FUNCTION get_recent_messages(
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  venue_id TEXT,
  venue_name TEXT,
  venue_category TEXT,
  user_id TEXT,
  username TEXT,
  avatar_url TEXT,
  content TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.venue_id,
    m.venue_name,
    m.venue_category,
    m.user_id,
    m.username,
    m.avatar_url,
    m.content,
    m.created_at
  FROM messages m
  WHERE m.is_deleted = FALSE
  ORDER BY m.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

