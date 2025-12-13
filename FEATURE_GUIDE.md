# CheckIn App - Feature Guide

## Overview

CheckIn is a social location-based app that lets users discover places, check in, and connect with friends. It's designed as a Progressive Web App (PWA) for a native-like experience on mobile devices.

## New Features

### 1. Friend System

**Add Friends:**
- Search for users by username
- Send friend requests
- Accept or decline incoming requests
- Remove friends

**Friend Activity:**
- See when friends check in at locations
- Get notified of friend check-ins (configurable)

**Access:**
- Profile → Friends tab
- Or click on the Friends count in your profile

### 2. Notifications System

**Notification Types:**
- 👋 Friend requests
- ✅ Friend request accepted
- 📍 Friend check-ins
- 💬 Replies to your check-ins
- 🔥 Trending spot alerts

**Push Notifications:**
- Enable push notifications for real-time alerts
- Works even when app is in background
- Configure which notifications you receive in Settings

**Access:**
- Bell icon in the header (shows unread count)

### 3. Trending/Hot Spots

**How it works:**
- Venues with 3+ check-ins in last 30 minutes appear as "trending"
- 5+ check-ins triggers notifications to nearby users
- Hot spots are highlighted in the new "Hot" tab

**Access:**
- New "Hot" tab in the main navigation

### 4. Progressive Web App (PWA)

**Install to Home Screen:**
- Chrome/Android: Install prompt appears automatically
- iOS/Safari: Use Share → Add to Home Screen

**Features when installed:**
- Full-screen native-like experience
- Offline support for cached content
- Push notifications
- App shortcuts

### 5. Settings Page

**Notification Settings:**
- Enable/disable push notifications
- Choose notification types:
  - Friend requests
  - Friend check-ins
  - Trending spots
  - Replies

**Privacy Settings:**
- **Public:** Everyone can see your check-ins
- **Friends Only:** Only friends see your activity
- **Private:** Only you see your check-ins
- Toggle map visibility
- Toggle check-in history visibility

**Account:**
- Download your data
- Sign out
- Delete account

**Access:**
- Profile → Settings button at bottom

## Database Setup

Run the `SCHEMA.sql` file in your Supabase SQL Editor to create:
- User settings table
- Friend requests table
- Friendships table
- Notifications table
- Helper functions for trending spots

## Environment Variables

Add to your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key  # Optional, for push notifications
```

## Push Notifications Setup (Optional)

For push notifications to work, you need:

1. Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

2. Add the public key to `.env` as `VITE_VAPID_PUBLIC_KEY`

3. Set up a server endpoint to send push notifications using the private key

## File Structure

New files created:

```
src/
├── components/
│   ├── FriendsPage.tsx      # Friend management UI
│   ├── NotificationCenter.tsx # Notifications panel
│   ├── SettingsPage.tsx     # Settings with sections
│   ├── InstallPrompt.tsx    # PWA install UI
│   └── TrendingSpots.tsx    # Hot spots component
├── lib/
│   ├── friends.ts           # Friend system logic
│   └── notifications.ts     # Notification handling
└── types/
    └── index.ts             # Updated with new types

public/
├── sw.js                    # Service worker
├── manifest.webmanifest     # PWA manifest
├── favicon.svg              # App icon
└── pwa-*.png               # PWA icons (replace with real ones)

SCHEMA.sql                   # Database migrations
```

## Monetization Ideas

1. **Premium Features:**
   - Extended check-in history
   - Custom badges/avatars
   - Priority in trending spots

2. **Business Features:**
   - Venue claiming for businesses
   - Analytics dashboard
   - Promoted check-ins

3. **Advertising:**
   - Sponsored venues
   - Local business promotions

4. **Partnerships:**
   - Restaurant deals for frequent visitors
   - Event promotions

## Next Steps

1. **Replace placeholder icons** with properly designed PNG icons
2. **Set up push notification server** for real-time alerts
3. **Add business verification** for venue owners
4. **Implement mayorships** - users who check in most become "mayor"
5. **Add social features** - likes, comments, photo uploads
6. **Create onboarding flow** for new users
7. **Add analytics** to track user engagement

