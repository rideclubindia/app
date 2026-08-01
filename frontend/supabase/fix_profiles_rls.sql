-- Fix for row-level security on the public.profiles table
-- Apply this in Supabase SQL Editor for your project.

-- Ensure RLS is enabled on the profiles table.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own profile.
DROP POLICY IF EXISTS "Allow authenticated users to select own profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to select own profiles"
  ON public.profiles
  FOR SELECT
  USING (id::text = auth.uid()::text);

-- Allow authenticated users to insert their own profile row.
DROP POLICY IF EXISTS "Allow authenticated users to insert own profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to insert own profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (id::text = auth.uid()::text);

-- Allow authenticated users to update their own profile row.
DROP POLICY IF EXISTS "Allow authenticated users to update own profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to update own profiles"
  ON public.profiles
  FOR UPDATE
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);
