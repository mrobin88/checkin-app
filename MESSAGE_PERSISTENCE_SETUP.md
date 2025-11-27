# 📨 Message Persistence Setup Guide

## ✅ What Changed

Your app now **persists all check-ins/messages to Supabase** instead of just localStorage!

### Features:
- ✅ **Database persistence** - Messages saved to Postgres
- ✅ **Real-time updates** - See new messages instantly via WebSocket
- ✅ **Fallback to localStorage** - Works even if Supabase isn't configured
- ✅ **Message history** - Load recent messages on app start
- ✅ **Cross-device sync** - Messages available on any device

---

## 🚀 Setup Steps

### Step 1: Run the Database Schema

1. Go to your Supabase dashboard:
   **https://supabase.com/dashboard/project/qpqlhqrzajwzggismznp/editor/sql**

2. Click **"New query"**

3. Copy the entire contents of `MESSAGES_SCHEMA.sql` and paste it

4. Click **"Run"** or press `Ctrl/Cmd + Enter`

5. You should see: ✅ **"Success. No rows returned"**

### Step 2: Verify Tables Created

1. Go to **Table Editor** in Supabase
2. You should see a new table: **`messages`**
3. Click on it to verify the columns exist

### Step 3: Enable Realtime (Important!)

1. Go to **Database → Replication** in Supabase
2. Find the **`messages`** table
3. Toggle it **ON** (enable replication)
4. This allows real-time updates!

### Step 4: Add Environment Variables (if not already done)

Make sure your `.env.local` has:

```env
VITE_SUPABASE_URL=https://qpqlhqrzajwzggismznp.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get your anon key from:
**https://supabase.com/dashboard/project/qpqlhqrzajwzggismznp/settings/api**

### Step 5: Test It!

1. Restart your dev server: `npm run dev`
2. Check the browser console - you should see:
   - `Loaded X messages from Supabase` (or localStorage fallback message)
3. Check in to a venue with a comment
4. Check the console - you should see: `✅ Message saved to Supabase`
5. Check Supabase Table Editor - you should see your message!

---

## 🔍 How It Works

### **Saving Messages:**
```
User checks in → App sends to Supabase → Message saved
                                       ↓
                        Real-time broadcast to all connected clients
                                       ↓
                        Other users see message instantly!
```

### **Loading Messages:**
```
App loads → Fetch from Supabase (last 50 messages)
                     ↓
         Display in Activity feed
                     ↓
         Subscribe to real-time updates
```

### **Fallback:**
```
Supabase unavailable? → Save to localStorage
                       → Load from localStorage
                       → Works offline!
```

---

## 📊 Database Schema

### **messages** table:
- `id` - Unique message ID (UUID)
- `venue_id` - Which venue/location
- `venue_name` - Venue name (denormalized)
- `user_id` - User ID (or 'anonymous')
- `username` - Display name
- `avatar_url` - User avatar
- `content` - Message text (max 2000 chars)
- `geohash` - Location verification
- `created_at` - Timestamp
- `is_deleted` - Soft delete flag

---

## 🧪 Testing Checklist

- [ ] Run SQL schema in Supabase
- [ ] Enable realtime on messages table
- [ ] Add .env.local with Supabase keys
- [ ] Restart dev server
- [ ] Check in to a venue
- [ ] Verify message appears in Activity feed
- [ ] Check Supabase Table Editor for message
- [ ] Open app in another browser/device
- [ ] Post a message - verify it appears instantly in both!

---

## 🐛 Troubleshooting

### "Loaded messages from localStorage (Supabase not available)"
- Your Supabase keys might not be configured
- Check `.env.local` exists with correct keys
- Restart dev server after adding keys

### "relation 'messages' does not exist"
- You haven't run the SQL schema yet
- Go to Supabase SQL Editor and run `MESSAGES_SCHEMA.sql`

### Messages don't appear in real-time
- Realtime is not enabled on the messages table
- Go to Database → Replication → Enable for messages table

### "Anonymous user cannot create messages"
- RLS policy issue
- Make sure you ran the full SQL schema including policies

---

## 🎉 You're Done!

Messages now persist across devices and updates happen in real-time! You can:
- ✅ Check in from your phone
- ✅ See it instantly on your laptop
- ✅ View history anytime
- ✅ Works with or without Supabase

**Next Steps:**
- Set up Google OAuth for real user accounts
- Add push notifications for @mentions
- Build moderation tools for venue owners

