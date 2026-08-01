-- Add Emergency SOS fields to the profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bike_details TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT;

-- Create ride_events if it doesn't exist (just in case, though it should exist already)
CREATE TABLE IF NOT EXISTS public.ride_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES public.rides(id),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL, -- e.g., 'SOS', 'JOINED', 'LEFT'
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
