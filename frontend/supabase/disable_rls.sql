-- Since you use Firebase Authentication instead of Supabase Auth, 
-- Supabase's auth.uid() function is always NULL. 
-- This means any Row Level Security (RLS) policies relying on it will fail.
-- To allow the frontend to access the data, we must temporarily disable RLS 
-- or make the tables publicly readable until a Custom JWT integration is built.

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_schedules DISABLE ROW LEVEL SECURITY;

-- Also drop the restrictive policies from profiles and confirmations just in case
DROP POLICY IF EXISTS "Allow authenticated users to select own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Admins can view all confirmations" ON public.confirmations;
DROP POLICY IF EXISTS "Admins can update all confirmations" ON public.confirmations;
DROP POLICY IF EXISTS "Admins can delete all confirmations" ON public.confirmations;
