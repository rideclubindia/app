-- Create saved_locations table for user-defined places (offices, home, etc.)
CREATE TABLE IF NOT EXISTS public.saved_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Create index for faster search
CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON public.saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_name ON public.saved_locations(name);

-- Allow users to search and manage their own saved locations
ALTER TABLE public.saved_locations DISABLE ROW LEVEL SECURITY;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_saved_locations_modtime ON public.saved_locations;
CREATE TRIGGER update_saved_locations_modtime
    BEFORE UPDATE ON public.saved_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Permissions for anon and authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_locations TO anon, authenticated;
