# 🔐 Fix Google OAuth "your-project.supabase.co" Error

## The Problem

You're seeing `your-project.supabase.co` because Google OAuth isn't configured in Supabase yet.

---

## 🚀 Quick Fix (10 minutes)

### **Step 1: Set Your Site URL in Supabase**

1. Go to: **https://supabase.com/dashboard/project/qpqlhqrzajwzggismznp/auth/url-configuration**

2. Set **Site URL** to your Vercel URL:
   ```
   https://your-app-name.vercel.app
   ```
   (Replace with your actual Vercel URL)

3. Add **Redirect URLs** (add both):
   ```
   http://localhost:5173/**
   https://your-app-name.vercel.app/**
   ```

4. Click **Save**

---

### **Step 2: Create Google OAuth Credentials**

#### A. Go to Google Cloud Console

1. **https://console.cloud.google.com/apis/credentials?project=checkin-479519**

2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**

#### B. Configure OAuth Consent Screen (if prompted)

1. Click **"CONFIGURE CONSENT SCREEN"**
2. Choose **"External"** → Click **"CREATE"**
3. Fill in:
   - **App name:** CheckIn
   - **User support email:** [your email]
   - **Developer email:** [your email]
4. Click **"SAVE AND CONTINUE"** through all steps
5. Click **"BACK TO DASHBOARD"**

#### C. Create OAuth Client ID

1. Go back to **Credentials** → **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
2. Application type: **"Web application"**
3. Name: **"CheckIn Web"**
4. **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   https://your-app-name.vercel.app
   ```
5. **Authorized redirect URIs:**
   ```
   https://qpqlhqrzajwzggismznp.supabase.co/auth/v1/callback
   http://localhost:5173
   ```
6. Click **"CREATE"**
7. **COPY YOUR CREDENTIALS:**
   - Client ID: `1035890953504-xxxxx.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxxxxxxxxxxxx`

---

### **Step 3: Add to Supabase**

1. Go to: **https://supabase.com/dashboard/project/qpqlhqrzajwzggismznp/auth/providers**

2. Find **Google** provider

3. Toggle **"Enable Sign in with Google"** to ON

4. Paste:
   - **Client ID** (from Google)
   - **Client Secret** (from Google)

5. Click **"Save"**

---

## ✅ Test It

1. Clear your browser cache
2. Go to your app
3. Click **"Sign In"** → **"Sign in with Google"**
4. Should now redirect to **Google's login page** (not your-project.supabase.co)
5. After login, redirects back to your app ✅

---

## 🐛 Safari-Specific Issues

### If OAuth still doesn't work in Safari:

1. **Disable "Prevent Cross-Site Tracking"**
   - Safari → Settings → Privacy
   - Uncheck "Prevent cross-site tracking" (temporarily for testing)

2. **Allow Third-Party Cookies**
   - Safari → Settings → Privacy
   - Uncheck "Block all cookies"

3. **Use Chrome/Firefox for Testing**
   - Safari has stricter privacy settings
   - Test in Chrome first to verify OAuth works

---

## 📋 Checklist

- [ ] Set Site URL in Supabase
- [ ] Add Redirect URLs in Supabase
- [ ] Create Google OAuth Client in Google Cloud Console
- [ ] Enable Google provider in Supabase
- [ ] Paste Client ID and Secret
- [ ] Test in Chrome (easier)
- [ ] Test in Safari (if needed, adjust privacy settings)

---

## 🎯 Common Errors

### "redirect_uri_mismatch"
- Make sure you added **both** these redirect URIs in Google Cloud Console:
  - `https://qpqlhqrzajwzggismznp.supabase.co/auth/v1/callback`
  - Your actual Vercel URL

### Still going to "your-project.supabase.co"
- You haven't enabled Google provider in Supabase yet
- Go to Step 3 above

### "Invalid client"
- Client ID or Secret is wrong
- Re-copy from Google Cloud Console
- Make sure there are no extra spaces

---

## 💡 What Your Vercel URL Is

Find it here:
1. Go to **https://vercel.com/dashboard**
2. Click your `checkin-app` project
3. Look for **Domains** section
4. Copy the URL (e.g., `checkin-app-xyz.vercel.app`)

---

**Once configured, "Continue as Guest" will still work, but you'll also have working Google OAuth!** 🎉

