-- ============================================
-- REPLIES / COMMENTS SYSTEM
-- Run this in Supabase SQL Editor
-- ============================================

-- Add parent_message_id to messages table for threading
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- Index for fast reply lookups
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_message_id) WHERE parent_message_id IS NOT NULL;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- User who should receive notification
  from_user_id TEXT NOT NULL, -- User who triggered it
  from_username TEXT NOT NULL,
  from_avatar_url TEXT,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reply', 'mention')),
  content TEXT NOT NULL, -- Preview of the reply/mention
  venue_name TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id = 'anonymous');

-- Anyone can create notifications
CREATE POLICY "Anyone can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can mark their notifications as read
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id = 'anonymous');

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function to increment reply count
CREATE OR REPLACE FUNCTION increment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_message_id IS NOT NULL THEN
    UPDATE messages 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.parent_message_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment reply count
DROP TRIGGER IF EXISTS trigger_increment_reply_count ON messages;
CREATE TRIGGER trigger_increment_reply_count
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.parent_message_id IS NOT NULL)
  EXECUTE FUNCTION increment_reply_count();

-- Function to create reply notification
CREATE OR REPLACE FUNCTION create_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
  parent_msg RECORD;
BEGIN
  IF NEW.parent_message_id IS NOT NULL THEN
    -- Get parent message info
    SELECT user_id, venue_name INTO parent_msg
    FROM messages
    WHERE id = NEW.parent_message_id;
    
    -- Only notify if replying to someone else
    IF parent_msg.user_id != NEW.user_id THEN
      INSERT INTO notifications (
        user_id,
        from_user_id,
        from_username,
        from_avatar_url,
        message_id,
        parent_message_id,
        notification_type,
        content,
        venue_name
      ) VALUES (
        parent_msg.user_id,
        NEW.user_id,
        NEW.username,
        NEW.avatar_url,
        NEW.id,
        NEW.parent_message_id,
        'reply',
        SUBSTRING(NEW.content, 1, 100),
        parent_msg.venue_name
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create notifications
DROP TRIGGER IF EXISTS trigger_create_reply_notification ON messages;
CREATE TRIGGER trigger_create_reply_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.parent_message_id IS NOT NULL)
  EXECUTE FUNCTION create_reply_notification();

-- Function to get replies for a message
CREATE OR REPLACE FUNCTION get_message_replies(
  p_parent_message_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
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
    m.user_id,
    m.username,
    m.avatar_url,
    m.content,
    m.created_at
  FROM messages m
  WHERE m.parent_message_id = p_parent_message_id
    AND m.is_deleted = FALSE
  ORDER BY m.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

