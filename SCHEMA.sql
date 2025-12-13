-- CheckIn App Database Schema - Optimized & Debloated
-- No PostGIS dependency - using geohashes instead
-- Run in Supabase SQL Editor

-- ============================================
-- EXTENSIONS (minimal)
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

CREATE POLICY "Users are viewable by everyone" ON users 
  FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users 
  FOR UPDATE USING ((auth.uid())::uuid = id);
CREATE POLICY "Users can insert their own profile" ON users 
  FOR INSERT WITH CHECK ((auth.uid())::uuid = id);

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  push_subscription JSONB,
  friend_request_notifications BOOLEAN DEFAULT true,
  friend_checkin_notifications BOOLEAN DEFAULT true,
  trending_notifications BOOLEAN DEFAULT true,
  reply_notifications BOOLEAN DEFAULT true,
  privacy_mode TEXT DEFAULT 'public' CHECK (privacy_mode IN ('public', 'friends_only', 'private')),
  show_on_map BOOLEAN DEFAULT true,
  show_checkin_history BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;

CREATE POLICY "Users can view their own settings" ON user_settings 
  FOR SELECT USING ((auth.uid())::uuid = user_id);
CREATE POLICY "Users can update their own settings" ON user_settings 
  FOR UPDATE USING ((auth.uid())::uuid = user_id);
CREATE POLICY "Users can insert their own settings" ON user_settings 
  FOR INSERT WITH CHECK ((auth.uid())::uuid = user_id);

-- ============================================
-- MESSAGES TABLE (Check-ins & Replies)
-- Using TEXT for user_id to support anonymous users
-- Using geohash instead of PostGIS for location
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_category TEXT,
  venue_lat DECIMAL(10, 8),
  venue_lng DECIMAL(11, 8),
  venue_address TEXT,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  content TEXT NOT NULL,
  geohash TEXT NOT NULL,
  parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  reply_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_venue_id ON messages(venue_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_geohash ON messages(geohash);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_not_deleted ON messages(is_deleted) WHERE is_deleted = false;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Messages are viewable by everyone" ON messages;
DROP POLICY IF EXISTS "Anyone can create messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

CREATE POLICY "Messages are viewable by everyone" ON messages 
  FOR SELECT USING (true);
CREATE POLICY "Anyone can create messages" ON messages 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own messages" ON messages 
  FOR UPDATE USING (
    CASE 
      WHEN auth.uid() IS NULL THEN user_id = 'anonymous'
      ELSE user_id = (auth.uid())::text
    END
  );
CREATE POLICY "Users can delete their own messages" ON messages 
  FOR DELETE USING (
    CASE 
      WHEN auth.uid() IS NULL THEN user_id = 'anonymous'
      ELSE user_id = (auth.uid())::text
    END
  );

-- Reply count trigger
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_message_id IS NOT NULL THEN
    UPDATE messages SET reply_count = reply_count + 1 WHERE id = NEW.parent_message_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_message_id IS NOT NULL THEN
    UPDATE messages SET reply_count = reply_count - 1 WHERE id = OLD.parent_message_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reply_count ON messages;
CREATE TRIGGER trigger_update_reply_count
AFTER INSERT OR DELETE ON messages
FOR EACH ROW EXECUTE FUNCTION update_reply_count();

-- ============================================
-- FRIEND REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can create requests" ON friend_requests;
DROP POLICY IF EXISTS "Recipients can update requests" ON friend_requests;

CREATE POLICY "Users can view their own requests" ON friend_requests 
  FOR SELECT USING ((auth.uid())::uuid = from_user_id OR (auth.uid())::uuid = to_user_id);
CREATE POLICY "Users can create requests" ON friend_requests 
  FOR INSERT WITH CHECK ((auth.uid())::uuid = from_user_id);
CREATE POLICY "Recipients can update requests" ON friend_requests 
  FOR UPDATE USING ((auth.uid())::uuid = to_user_id);

-- ============================================
-- FRIENDSHIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK(user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view friendships" ON friendships;
DROP POLICY IF EXISTS "Users can view their friendships" ON friendships;
DROP POLICY IF EXISTS "Users can create friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON friendships;

CREATE POLICY "Users can view their friendships" ON friendships 
  FOR SELECT USING ((auth.uid())::uuid = user_id OR (auth.uid())::uuid = friend_id);
CREATE POLICY "Users can create friendships" ON friendships 
  FOR INSERT WITH CHECK ((auth.uid())::uuid = user_id);
CREATE POLICY "Users can delete their friendships" ON friendships 
  FOR DELETE USING ((auth.uid())::uuid = user_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  from_username TEXT,
  from_avatar_url TEXT,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reply', 'mention', 'friend_request', 'friend_accepted', 'trending_spot', 'friend_checkin')),
  content TEXT NOT NULL,
  venue_name TEXT,
  venue_id TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;

CREATE POLICY "Users can view their notifications" ON notifications 
  FOR SELECT USING ((auth.uid())::uuid = user_id);
CREATE POLICY "System can create notifications" ON notifications 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their notifications" ON notifications 
  FOR UPDATE USING ((auth.uid())::uuid = user_id);

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ============================================
-- HELPER FUNCTIONS (Optimized)
-- ============================================

-- Get trending spots (simple counting, no complex geospatial queries)
CREATE OR REPLACE FUNCTION get_trending_spots(time_window_minutes INTEGER DEFAULT 30, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  venue_id TEXT,
  venue_name TEXT,
  venue_category TEXT,
  venue_lat DECIMAL,
  venue_lng DECIMAL,
  checkin_count BIGINT,
  unique_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.venue_id,
    MAX(m.venue_name) as venue_name,
    MAX(m.venue_category) as venue_category,
    MAX(m.venue_lat) as venue_lat,
    MAX(m.venue_lng) as venue_lng,
    COUNT(*) as checkin_count,
    COUNT(DISTINCT m.user_id) as unique_users
  FROM messages m
  WHERE m.created_at > NOW() - (time_window_minutes || ' minutes')::INTERVAL
    AND m.parent_message_id IS NULL
    AND m.is_deleted = false
  GROUP BY m.venue_id
  HAVING COUNT(*) >= 3
  ORDER BY checkin_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if spot is trending (lightweight query)
CREATE OR REPLACE FUNCTION is_spot_trending(check_venue_id TEXT, time_window_minutes INTEGER DEFAULT 10)
RETURNS TABLE (
  is_trending BOOLEAN,
  checkin_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) >= 5 as is_trending,
    COUNT(*) as checkin_count
  FROM messages
  WHERE venue_id = check_venue_id
    AND created_at > NOW() - (time_window_minutes || ' minutes')::INTERVAL
    AND parent_message_id IS NULL
    AND is_deleted = false;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- CLEANUP: Remove old bloat if it exists
-- ============================================
DO $$
BEGIN
  -- Drop old PostGIS-related functions if they exist
  DROP FUNCTION IF EXISTS nearby_venues CASCADE;
  DROP FUNCTION IF EXISTS recent_checkins CASCADE;
  
  -- Drop old unused tables if they exist
  DROP TABLE IF EXISTS venues CASCADE;
  DROP TABLE IF EXISTS checkins CASCADE;
  
  RAISE NOTICE '🧹 Cleaned up old unused objects';
END $$;

-- Done!
DO $$ BEGIN 
  RAISE NOTICE '✅ Optimized schema setup complete!';
  RAISE NOTICE '📦 No PostGIS bloat - using geohashes';
  RAISE NOTICE '🚀 6 lightweight tables, optimized indexes';
END $$;
