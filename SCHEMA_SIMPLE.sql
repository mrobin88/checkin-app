-- MINIMAL SCHEMA - Just What You Need
-- Copy & paste this ENTIRE file into Supabase SQL Editor and hit Run

-- Clean slate - drop everything first
DROP POLICY IF EXISTS "Users can view their friendships" ON friendships;
DROP POLICY IF EXISTS "Users can create friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON friendships;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS update_reply_count CASCADE;

-- Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (just username from OAuth)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_read_users" ON users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- Auto-create user profile on signup
CREATE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 2. FRIENDSHIPS (super simple - no requests)
-- ============================================
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_friendships" ON friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "create_friendships" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_friendships" ON friendships FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. MESSAGES TABLE (already exists, just ensure RLS)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    CREATE TABLE messages (
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
    
    CREATE INDEX idx_messages_user ON messages(user_id);
    CREATE INDEX idx_messages_venue ON messages(venue_id);
    CREATE INDEX idx_messages_created ON messages(created_at DESC);
  END IF;
END $$;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_read_messages" ON messages;
DROP POLICY IF EXISTS "anyone_create_messages" ON messages;
DROP POLICY IF EXISTS "users_update_own_messages" ON messages;
DROP POLICY IF EXISTS "users_delete_own_messages" ON messages;

CREATE POLICY "anyone_read_messages" ON messages FOR SELECT USING (true);
CREATE POLICY "anyone_create_messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_own_messages" ON messages FOR UPDATE USING (
  CASE WHEN auth.uid() IS NULL THEN user_id = 'anonymous' ELSE user_id = auth.uid()::text END
);
CREATE POLICY "users_delete_own_messages" ON messages FOR DELETE USING (
  CASE WHEN auth.uid() IS NULL THEN user_id = 'anonymous' ELSE user_id = auth.uid()::text END
);

-- Reply counter
CREATE OR REPLACE FUNCTION update_reply_count() RETURNS TRIGGER AS $$
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
CREATE TRIGGER trigger_update_reply_count AFTER INSERT OR DELETE ON messages
FOR EACH ROW EXECUTE FUNCTION update_reply_count();

-- ============================================
-- 4. BUSINESS CLAIMS (venue owners can claim)
-- ============================================
CREATE TABLE IF NOT EXISTS venue_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  claim_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venue_claims_venue ON venue_claims(venue_id);
CREATE INDEX idx_venue_claims_user ON venue_claims(user_id);
CREATE INDEX idx_venue_claims_status ON venue_claims(status);

ALTER TABLE venue_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_view_own_claims" ON venue_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_create_claims" ON venue_claims FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. LIKES TABLE (double-tap to like)
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_likes_message ON likes(message_id);
CREATE INDEX idx_likes_user ON likes(user_id);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_view_likes" ON likes FOR SELECT USING (true);
CREATE POLICY "users_create_likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. BOOKMARKS TABLE (save venues for later)
-- ============================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, user_id)
);

CREATE INDEX idx_bookmarks_venue ON bookmarks(venue_id);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_view_own_bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_create_bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- REALTIME
-- ============================================
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE friendships; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE likes; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Done!
SELECT '✅ Enhanced schema ready! Likes, bookmarks, and more!' as status;

