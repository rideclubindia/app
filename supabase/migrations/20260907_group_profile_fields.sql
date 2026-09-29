-- SUPABASE MIGRATION: 20260907_group_profile_fields.sql
-- DESCRIPTION: Groups had no cover photo, bio, or location — the Group Info
-- reference (hero photo banner, bio line, location row, Edit button) can't
-- render for real without these.

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS location_name TEXT;
