-- SUPABASE MIGRATION: 20260907_group_features_expansion.sql
-- DESCRIPTION: Real backing for the group-info features that were previously
-- either missing or decorative: ride plans linked to a group, media/location
-- sharing in group chat, pinned messages, and per-member mute state.

-- Ride Plans: a ride can optionally belong to a group.
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_rides_group_id ON public.rides(group_id);

-- Group Media / Shared Locations: messages can carry an image or a location,
-- not just text.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text';
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION;
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;

-- Pinned Messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_messages_is_pinned ON public.messages(group_id, is_pinned) WHERE is_pinned = true;

-- Notifications: per-member mute state for a group.
ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS muted BOOLEAN NOT NULL DEFAULT false;
