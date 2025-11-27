# OAuth Setup Guide

## ✅ What Works Now (No Setup Needed)

Your app is **fully functional** right now:
- ✅ Check in to venues **anonymously** (no login required)
- ✅ All check-ins saved to localStorage
- ✅ View your check-in history
- ✅ Works on your phone tonight!

## 🔐 Optional: Enable Google OAuth Login

If you want users to sign in with Google (to sync across devices), follow these steps:

### Step 1: Configure Google OAuth in Supabase

1. Go to your Supabase dashboard:
   **https://supabase.com/dashboard/project/qpqlhqrzajwzggismznp/auth/providers**

2. Click on **Google** provider

3. Enable it and you'll need:
   - Client ID
   - Client Secret

### Step 2: Create Google OAuth Credentials

1. Go to **Google Cloud Console**: https://console.cloud.google.com/

2. Create a new project (or use existing one):
   - Click "Select a project" → "New Project"
   - Name it: "CheckIn App"

3. Enable Google+ API:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

4. Create OAuth Credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Application type: **Web application**
   - Name: "CheckIn App"
   
5. Add Authorized redirect URIs:
   ```
   https://qpqlhqrzajwzggismznp.supabase.co/auth/v1/callback
   ```
   
   And for local development:
   ```
   http://localhost:5173
   ```

6. Click **Create**

7. Copy your:
   - **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-xxxxxxxxxxxxx`)

### Step 3: Add to Supabase

1. Go back to Supabase → **Authentication** → **Providers** → **Google**

2. Paste:
   - **Client ID** (from Google)
   - **Client Secret** (from Google)

3. Click **Save**

### Step 4: Test It!

1. Open your app
2. Click **Sign In** button
3. Click **Sign in with Google**
4. Authorize the app
5. You're logged in! 🎉

Now when you check in, it will be associated with your Google account!

---

## How It Works

### Anonymous Mode (Default)
- No login required
- Check-ins saved to browser localStorage
- Username shows as "Anonymous"
- Works offline
- Check-ins only on this device/browser

### Logged In Mode (Optional)
- Sign in with Google
- Check-ins saved to localStorage + (optionally) Supabase cloud
- Shows your Google name & photo
- Can sync across devices (if Supabase configured)

---

## Current Status

✅ **App is deployed and working**  
✅ **Anonymous check-ins work**  
✅ **Check-in history persists**  
⏳ **Google OAuth** - Optional, requires setup above  
⏳ **Supabase cloud storage** - Optional, for cross-device sync  

**You can use the app tonight without any OAuth setup!** Just walk around and check in anonymously. 📱

