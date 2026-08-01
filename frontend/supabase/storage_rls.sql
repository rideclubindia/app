-- Storage RLS Policies for Supabase
-- Run this in your Supabase SQL Editor to secure file uploads

-- Ensure the incident-photos bucket exists with validation
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'incident-photos', 
  'incident-photos', 
  true, 
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Note: RLS is enabled by default on storage.objects.

-- 1. Allow public read access to all incident photos
DROP POLICY IF EXISTS "Public can view incident photos" ON storage.objects;
CREATE POLICY "Public can view incident photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'incident-photos');

-- 2. Allow authenticated users to upload new photos
DROP POLICY IF EXISTS "Authenticated users can upload incident photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload incident photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'incident-photos'
  AND auth.uid() = owner
);

-- 3. Allow users to update their own photos
DROP POLICY IF EXISTS "Users can update their own incident photos" ON storage.objects;
CREATE POLICY "Users can update their own incident photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'incident-photos'
  AND auth.uid() = owner
);

-- 4. Allow users to delete their own photos
DROP POLICY IF EXISTS "Users can delete their own incident photos" ON storage.objects;
CREATE POLICY "Users can delete their own incident photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'incident-photos'
  AND auth.uid() = owner
);
