-- SUPABASE MIGRATION: 20260909_pins_icon_name.sql
-- DESCRIPTION: "Other" incidents let the reporter pick a custom icon (Food,
-- Festival, Music, Shopping, ...) instead of falling back to a generic
-- marker. Store that choice so every screen that renders a pin can look it
-- up instead of only ever resolving an icon from the fixed category list.

ALTER TABLE public.pins
  ADD COLUMN IF NOT EXISTS icon_name TEXT;
