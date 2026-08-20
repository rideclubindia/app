-- Re-enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- We can now use auth.uid() securely because the frontend injects a Custom HS256 JWT
-- signed by the Python backend containing the verified Firebase UID as the 'sub'.

-- Example Policies:
-- Profiles
CREATE POLICY "Allow users to view all active profiles" 
ON public.profiles FOR SELECT USING (status != 'banned');

CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to insert own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- CMS (Publicly readable, admin editable)
CREATE POLICY "CMS is publicly readable"
ON public.cms_content FOR SELECT USING (true);

-- Rides
CREATE POLICY "Anyone can view active rides"
ON public.rides FOR SELECT USING (true);

CREATE POLICY "Users can create rides"
ON public.rides FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own rides"
ON public.rides FOR UPDATE USING (auth.uid() = owner_id);

-- Incidents
CREATE POLICY "Anyone can view incidents"
ON public.incidents FOR SELECT USING (true);

CREATE POLICY "Users can report incidents"
ON public.incidents FOR INSERT WITH CHECK (auth.uid() = reporter_id);
