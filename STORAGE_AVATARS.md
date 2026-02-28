# Profile picture upload – Storage bucket

Profile photos are stored in Supabase Storage. Create the bucket once:

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Storage**.
2. Click **New bucket**.
3. Name: `avatars`
4. Enable **Public bucket** (so profile images can be shown).
5. Click **Create bucket**.
6. Open the bucket → **Policies** → **New policy** → “For full customization”:
   - **Policy name:** `Users can upload their own avatar`
   - **Allowed operation:** INSERT (and UPDATE if you want overwrite)
   - **Target roles:** authenticated
   - **USING expression:** leave default or use `true`
   - **WITH CHECK expression:** `(storage.foldername(name))[1] = auth.uid()::text`  
     (so users can only upload under a folder named with their user id)

Alternatively use a simple policy: allow **authenticated** users to **INSERT** and **UPDATE** with WITH CHECK `true` if you’re okay with any path (we use `userId/avatar.jpg` in the app).

After the bucket exists, profile picture upload in the app will work.
