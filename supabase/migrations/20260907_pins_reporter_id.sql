-- SUPABASE MIGRATION: 20260907_pins_reporter_id.sql
-- DESCRIPTION: pins had no reporter user id (only a free-text reporter_name),
-- so a "My Reports" filter on the Incidents list had nothing real to filter by.

ALTER TABLE public.pins
  ADD COLUMN IF NOT EXISTS reporter_id UUID;

CREATE INDEX IF NOT EXISTS idx_pins_reporter_id ON public.pins(reporter_id);
