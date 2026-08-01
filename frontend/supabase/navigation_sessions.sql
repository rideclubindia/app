-- Create navigation_sessions table
CREATE TABLE IF NOT EXISTS public.navigation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    origin_lat DOUBLE PRECISION NOT NULL,
    origin_lng DOUBLE PRECISION NOT NULL,
    dest_lat DOUBLE PRECISION NOT NULL,
    dest_lng DOUBLE PRECISION NOT NULL,
    dest_name TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn off RLS initially since the app relies on Firebase Auth and anon key
ALTER TABLE public.navigation_sessions DISABLE ROW LEVEL SECURITY;

-- Create an trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_navigation_sessions_modtime ON public.navigation_sessions;
CREATE TRIGGER update_navigation_sessions_modtime
    BEFORE UPDATE ON public.navigation_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
