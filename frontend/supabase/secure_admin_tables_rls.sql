-- Fix for missing Row Level Security on admin tables
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS on all admin tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_schedules ENABLE ROW LEVEL SECURITY;

-- 2. Create a secure function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Apply Policies for admin_users
-- Admins can read the table, nobody else. Super admins could be added later for updates/inserts.
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users"
ON public.admin_users FOR SELECT
USING (public.is_admin());

-- 4. Apply Policies for audit_logs
DROP POLICY IF EXISTS "Admins can view audit_logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit_logs"
ON public.audit_logs FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert audit_logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit_logs"
ON public.audit_logs FOR INSERT
WITH CHECK (public.is_admin());

-- 5. Apply Policies for api_logs
DROP POLICY IF EXISTS "Admins can view api_logs" ON public.api_logs;
CREATE POLICY "Admins can view api_logs"
ON public.api_logs FOR SELECT
USING (public.is_admin());

-- 6. Apply Policies for user_reports
-- Any authenticated user can insert a report. Only admins can view/update/delete.
DROP POLICY IF EXISTS "Users can insert reports" ON public.user_reports;
CREATE POLICY "Users can insert reports"
ON public.user_reports FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage user_reports" ON public.user_reports;
CREATE POLICY "Admins can manage user_reports"
ON public.user_reports FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7. Apply Policies for cms_content
-- Anyone can view published content, but only admins can manage it.
DROP POLICY IF EXISTS "Public can view published cms_content" ON public.cms_content;
CREATE POLICY "Public can view published cms_content"
ON public.cms_content FOR SELECT
USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage cms_content" ON public.cms_content;
CREATE POLICY "Admins can manage cms_content"
ON public.cms_content FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 8. Apply Policies for news_articles
-- Anyone can view published articles, but only admins can manage.
DROP POLICY IF EXISTS "Public can view published news_articles" ON public.news_articles;
CREATE POLICY "Public can view published news_articles"
ON public.news_articles FOR SELECT
USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage news_articles" ON public.news_articles;
CREATE POLICY "Admins can manage news_articles"
ON public.news_articles FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 9. Apply Policies for videos
-- Anyone can view published videos, but only admins can manage.
DROP POLICY IF EXISTS "Public can view published videos" ON public.videos;
CREATE POLICY "Public can view published videos"
ON public.videos FOR SELECT
USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage videos" ON public.videos;
CREATE POLICY "Admins can manage videos"
ON public.videos FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 10. Apply Policies for notification_schedules
-- Only admins can manage notification schedules
DROP POLICY IF EXISTS "Admins can manage notification_schedules" ON public.notification_schedules;
CREATE POLICY "Admins can manage notification_schedules"
ON public.notification_schedules FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());
