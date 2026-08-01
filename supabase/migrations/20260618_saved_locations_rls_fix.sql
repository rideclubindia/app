-- Fix RLS and permissions for saved_locations used by Firebase-auth frontend via anon key.
-- This migration is idempotent and safe to run multiple times.

-- Ensure table exists (if not, create a minimal compatible schema)
CREATE TABLE IF NOT EXISTS public.saved_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    location_type TEXT DEFAULT 'custom' CHECK (location_type IN ('home', 'work', 'custom')),
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, name)
);

-- Keep behavior aligned with navigation_sessions strategy in this app.
ALTER TABLE public.saved_locations DISABLE ROW LEVEL SECURITY;

-- Explicit grants for both anon and authenticated clients.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_locations TO anon, authenticated;

-- Helpful indexes.
CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON public.saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_name ON public.saved_locations(name);
