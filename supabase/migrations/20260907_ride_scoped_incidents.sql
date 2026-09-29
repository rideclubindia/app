-- SUPABASE MIGRATION: 20260907_ride_scoped_incidents.sql
-- DESCRIPTION: Allow incident reports (pins) to be scoped to a specific ride,
-- with a short free-text title and multiple photos, so a ride's own incident
-- feed only shows reports relevant to that ride (not the whole community).

ALTER TABLE public.pins
  ADD COLUMN IF NOT EXISTS ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE;

ALTER TABLE public.pins
  ADD COLUMN IF NOT EXISTS title TEXT;

-- photo_urls replaces the single photo_url for multi-photo reports; photo_url
-- stays for backward compatibility with existing rows/readers.
ALTER TABLE public.pins
  ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_pins_ride_id ON public.pins(ride_id);
