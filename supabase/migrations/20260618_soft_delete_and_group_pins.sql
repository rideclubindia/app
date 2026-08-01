-- ============================================================
-- Migration: Soft delete for profiles + group pinned messages
-- Date: 2026-06-18
-- ============================================================

-- 1. Add soft-delete column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for fast filtering of active/deleted users
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);

-- 2. Add pinned_message_id to groups table
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS pinned_message_id UUID DEFAULT NULL;

-- 3. RLS: Admins can read ALL profiles including soft-deleted ones
-- (Non-admin users should not see deleted profiles)
-- Existing RLS policies on profiles should already allow admins full access.
-- Add a policy to ensure service_role / admin can always access deleted profiles.

-- 4. Scheduled cleanup: auto-purge profiles deleted more than 30 days ago
-- NOTE: Run this via a pg_cron job or Supabase Edge Function scheduled task.
-- Example cron (run daily): 
--   SELECT cron.schedule('purge-deleted-users', '0 2 * * *', $$
--     DELETE FROM public.profiles WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';
--   $$);

-- If pg_cron is available in your Supabase plan, uncomment below:
-- SELECT cron.schedule(
--   'purge-deleted-profiles',
--   '0 2 * * *',
--   $$ DELETE FROM public.profiles WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'; $$
-- );
