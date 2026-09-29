-- Lock down public.profiles: the public (anon) key may only read display-safe columns and can never write.
-- Private fields and all writes go through the backend (/api/v1/me/profile, /api/v1/admin/profiles), which connects as postgres.
-- Run AFTER the backend and app build that use those endpoints are deployed.

DROP POLICY IF EXISTS app_insert_profiles ON public.profiles;
DROP POLICY IF EXISTS app_update_profiles ON public.profiles;
DROP POLICY IF EXISTS app_delete_profiles ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, avatar_url, status, created_at, deleted_at) ON public.profiles TO anon, authenticated;

-- Realtime would otherwise stream whole rows, including private columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
  END IF;
END $$;
