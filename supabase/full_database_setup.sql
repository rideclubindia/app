-- ============================================================
-- RIDE CLUB: Full Schema Migration for New Supabase Project
-- Project: gqgxrdoprlkketyvxnac
-- Date: 2026-07-02
-- Description: Creates all tables, indexes, RLS policies, 
--              triggers, functions, and storage buckets.
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE (core user table)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    blood_group TEXT,
    emergency_contact TEXT,
    bike_details JSONB,
    status TEXT DEFAULT 'active',
    role TEXT DEFAULT 'user',
    alerts_last_viewed BIGINT,
    policy_accepted_at TIMESTAMPTZ,
    device_info TEXT,
    accepted_privacy_version INTEGER,
    accepted_terms_version INTEGER,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated;


-- ============================================================
-- 2. GROUPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    admin_id TEXT NOT NULL,
    radius INTEGER DEFAULT 10,
    is_private BOOLEAN DEFAULT false,
    passcode TEXT,
    pinned_message_id UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO anon, authenticated;


-- ============================================================
-- 3. GROUP_MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    username TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);

ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO anon, authenticated;


-- ============================================================
-- 4. MESSAGES TABLE (group chat)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID,
    username TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_group_id ON public.messages(group_id);

ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO anon, authenticated;


-- ============================================================
-- 5. PINS TABLE (incident reports)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    severity INTEGER DEFAULT 1,
    photo_url TEXT,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    reporter_name TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pins_status ON public.pins(status);
CREATE INDEX IF NOT EXISTS idx_pins_created_at ON public.pins(created_at);
CREATE INDEX IF NOT EXISTS idx_pins_category ON public.pins(category);
CREATE INDEX IF NOT EXISTS idx_pins_group_id ON public.pins(group_id);

ALTER TABLE public.pins DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pins TO anon, authenticated;


-- ============================================================
-- 6. CONFIRMATIONS TABLE (incident vote/trust system)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    is_false BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pin_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_confirmations_pin_id ON public.confirmations(pin_id);

ALTER TABLE public.confirmations DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.confirmations TO anon, authenticated;


-- ============================================================
-- 7. ALERT_VIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alert_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    viewed_at BIGINT NOT NULL,
    UNIQUE(pin_id, user_id)
);

ALTER TABLE public.alert_views DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_views TO anon, authenticated;


-- ============================================================
-- 8. INCIDENT_CATEGORIES TABLE (CMS-driven categories)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.incident_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value TEXT NOT NULL UNIQUE,
    icon_name TEXT DEFAULT 'MoreHorizontal',
    color_class TEXT DEFAULT 'text-gray-600',
    bg_class TEXT DEFAULT 'bg-gray-100',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.incident_categories DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incident_categories TO anon, authenticated;

-- Seed default incident categories
INSERT INTO public.incident_categories (value, icon_name, color_class, bg_class, display_order) VALUES
    ('Traffic Jam', 'Car', 'text-green-500', 'bg-green-50', 1),
    ('Accident', 'Car', 'text-red-500', 'bg-red-50', 2),
    ('Road Closed', 'Ban', 'text-yellow-500', 'bg-yellow-50', 3),
    ('Flood', 'Waves', 'text-blue-500', 'bg-blue-50', 4),
    ('Vibe Check', 'Shield', 'text-blue-600', 'bg-blue-50', 5),
    ('Construction', 'Hammer', 'text-yellow-600', 'bg-yellow-50', 6),
    ('Hazard', 'Flame', 'text-orange-500', 'bg-orange-50', 7),
    ('Other', 'MoreHorizontal', 'text-gray-600', 'bg-gray-100', 8)
ON CONFLICT (value) DO NOTHING;


-- ============================================================
-- 9. NAVIGATION_SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.navigation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    origin_lat DOUBLE PRECISION,
    origin_lng DOUBLE PRECISION,
    dest_lat DOUBLE PRECISION,
    dest_lng DOUBLE PRECISION,
    dest_name TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_navigation_sessions_user_id ON public.navigation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_navigation_sessions_status ON public.navigation_sessions(status);

ALTER TABLE public.navigation_sessions DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.navigation_sessions TO anon, authenticated;


-- ============================================================
-- 10. SAVED_LOCATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saved_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    location_type TEXT DEFAULT 'custom' CHECK (location_type IN ('home', 'work', 'custom')),
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON public.saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_name ON public.saved_locations(name);

ALTER TABLE public.saved_locations DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_locations TO anon, authenticated;


-- ============================================================
-- 11. RIDES TABLE (Ride+ feature)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_code TEXT UNIQUE,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    visibility TEXT DEFAULT 'public',
    max_riders INTEGER DEFAULT 50,
    ride_date TIMESTAMPTZ,
    vehicle_type TEXT,
    image_url TEXT,
    start_location JSONB,
    destination JSONB,
    status TEXT DEFAULT 'scheduled',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_owner_id ON public.rides(owner_id);
CREATE INDEX IF NOT EXISTS idx_rides_ride_code ON public.rides(ride_code);

ALTER TABLE public.rides DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rides TO anon, authenticated;


-- ============================================================
-- 12. RIDE_MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ride_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'rider',
    status TEXT DEFAULT 'pending',
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ride_members_ride_id ON public.ride_members(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_members_user_id ON public.ride_members(user_id);

ALTER TABLE public.ride_members DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_members TO anon, authenticated;


-- ============================================================
-- 13. RIDE_STOPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ride_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    stop_name TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    sequence INTEGER DEFAULT 0,
    stop_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ride_stops_ride_id ON public.ride_stops(ride_id);

ALTER TABLE public.ride_stops DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_stops TO anon, authenticated;


-- ============================================================
-- 14. RIDE_LOCATIONS TABLE (live tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ride_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ride_locations_ride_id ON public.ride_locations(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_locations_user_id ON public.ride_locations(user_id);

ALTER TABLE public.ride_locations DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_locations TO anon, authenticated;


-- ============================================================
-- 15. RIDE_EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ride_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    description TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ride_events_ride_id ON public.ride_events(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_events_event_type ON public.ride_events(event_type);

ALTER TABLE public.ride_events DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_events TO anon, authenticated;


-- ============================================================
-- 16. RIDE_EDIT_LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ride_edit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    editor_id TEXT NOT NULL,
    editor_name TEXT,
    edit_type TEXT NOT NULL,
    changes JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ride_edit_log_ride_id ON public.ride_edit_log(ride_id);

ALTER TABLE public.ride_edit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view ride edit logs"
    ON public.ride_edit_log FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert ride edit logs"
    ON public.ride_edit_log FOR INSERT
    WITH CHECK (true);


-- ============================================================
-- 17. VEHICLE_TYPES TABLE (CMS lookup)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vehicle_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vehicle_types DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_types TO anon, authenticated;

-- Seed default vehicle types
INSERT INTO public.vehicle_types (value, label, display_order) VALUES
    ('motorcycle', 'Motorcycle', 1),
    ('scooter', 'Scooter', 2),
    ('superbike', 'Super Bike', 3),
    ('cruiser', 'Cruiser', 4),
    ('adventure', 'Adventure', 5),
    ('sport', 'Sport', 6),
    ('touring', 'Touring', 7),
    ('electric', 'Electric', 8),
    ('other', 'Other', 9)
ON CONFLICT (value) DO NOTHING;


-- ============================================================
-- 18. STOP_TYPES TABLE (CMS lookup)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stop_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stop_types DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stop_types TO anon, authenticated;

-- Seed default stop types
INSERT INTO public.stop_types (value, label, display_order) VALUES
    ('Start', 'Start Point', 1),
    ('Waypoint', 'Waypoint', 2),
    ('Tea Break', 'Tea Break', 3),
    ('Fuel Stop', 'Fuel Stop', 4),
    ('Meal Break', 'Meal Break', 5),
    ('Rest Stop', 'Rest Stop', 6),
    ('Photo Stop', 'Photo Stop', 7),
    ('Destination', 'Destination', 8)
ON CONFLICT (value) DO NOTHING;


-- ============================================================
-- 19. CMS_POLICIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cms_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    version INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cms_policies DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_policies TO anon, authenticated;


-- ============================================================
-- 19b. CMS_CONTENT TABLE (dynamic app settings, pages)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cms_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    slug TEXT UNIQUE,
    content_type TEXT DEFAULT 'page',
    content JSONB,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_content_slug ON public.cms_content(slug);

ALTER TABLE public.cms_content DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_content TO anon, authenticated;


-- ============================================================
-- 19c. ERROR_LOGS TABLE (frontend error tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT,
    error_message TEXT,
    error_stack TEXT,
    route TEXT,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.error_logs DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.error_logs TO anon, authenticated;


-- ============================================================
-- 20. AUDIT_LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id UUID,
    action TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO anon, authenticated;


-- ============================================================
-- 21. SUPPORT_TICKETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_name TEXT,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open',
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_tickets DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO anon, authenticated;


-- ============================================================
-- 22. SUPPORT_MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_name TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_messages DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO anon, authenticated;


-- ============================================================
-- 23. TRIGGERS & FUNCTIONS
-- ============================================================

-- Alert views cleanup trigger on pin status change
CREATE OR REPLACE FUNCTION public.clean_inactive_alert_views()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != 'active' THEN
        DELETE FROM public.alert_views WHERE pin_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cleanup_inactive_pins_trigger ON public.pins;
CREATE TRIGGER cleanup_inactive_pins_trigger
    AFTER UPDATE OF status ON public.pins
    FOR EACH ROW
    WHEN (NEW.status != 'active')
    EXECUTE FUNCTION public.clean_inactive_alert_views();

-- Expired alert views cleanup function (12 hours)
CREATE OR REPLACE FUNCTION public.cleanup_expired_alert_views()
RETURNS void AS $$
BEGIN
    DELETE FROM public.alert_views
    WHERE viewed_at < (EXTRACT(EPOCH FROM NOW()) * 1000) - 43200000;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 24. REALTIME PUBLICATIONS
-- ============================================================
-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_edit_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cms_content;
ALTER PUBLICATION supabase_realtime ADD TABLE public.error_logs;


-- ============================================================
-- 25. STORAGE BUCKETS
-- ============================================================

-- Bucket: incident-photos (ride cover images and incident photos)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('incident-photos', 'incident-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket: support_attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('support_attachments', 'support_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket: Ride Club (main app bucket)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('Ride Club', 'Ride Club', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Allow public access for uploads and reads
DROP POLICY IF EXISTS "Anyone can upload photos" ON storage.objects;
CREATE POLICY "Anyone can upload photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id IN ('incident-photos', 'support_attachments', 'Ride Club'));

DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
CREATE POLICY "Anyone can view photos" ON storage.objects
    FOR SELECT USING (bucket_id IN ('incident-photos', 'support_attachments', 'Ride Club'));

DROP POLICY IF EXISTS "Anyone can update photos" ON storage.objects;
CREATE POLICY "Anyone can update photos" ON storage.objects
    FOR UPDATE USING (bucket_id IN ('incident-photos', 'support_attachments', 'Ride Club'));

DROP POLICY IF EXISTS "Anyone can delete photos" ON storage.objects;
CREATE POLICY "Anyone can delete photos" ON storage.objects
    FOR DELETE USING (bucket_id IN ('incident-photos', 'support_attachments', 'Ride Club'));


-- ============================================================
-- 26. SEED CMS POLICIES (Privacy & Terms)
-- ============================================================
INSERT INTO public.cms_policies (type, content, version, is_published, created_at, updated_at) VALUES
('privacy', 'RIDE CLUB PRIVACY POLICY

Welcome to Ride Club. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our application and tell you about your privacy rights and how the law protects you.

1. IMPORTANT INFORMATION AND WHO WE ARE
This privacy policy aims to give you information on how Ride Club collects and processes your personal data through your use of this application.

2. THE DATA WE COLLECT ABOUT YOU
- Identity Data: first name, last name, username, profile picture.
- Contact Data: email address and telephone numbers.
- Location Data: real-time geographic location, historical route data, and speed.
- Technical Data: IP address, login data, browser type and version.
- Usage Data: how you use our application, participate in rides, and report incidents.

3. HOW WE USE YOUR PERSONAL DATA
We will only use your personal data when the law allows us to.

4. DATA SECURITY
We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way.

5. YOUR LEGAL RIGHTS
You have rights including: access, correction, erasure, objection, restriction, transfer, and withdrawal of consent.', 1, true, NOW(), NOW()),

('terms', 'RIDE CLUB TERMS OF SERVICE

Welcome to Ride Club. Please read these Terms of Service carefully before using our application.

1. ACCEPTANCE OF TERMS
By accessing or using the Ride Club application, you agree to be bound by these Terms.

2. DESCRIPTION OF SERVICE
Ride Club provides real-time navigation, group ride coordination, and crowdsourced road incident reporting.

3. USER RESPONSIBILITIES
- You must follow all local traffic laws and regulations.
- The app is a supplementary aid; do not rely solely on it for navigation or safety.
- Do not interact with the app in a way that distracts you from safe driving.

4. LOCATION TRACKING
By using the app, you consent to sharing your location data with your group members during active rides.

5. TERMINATION
We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever.', 1, true, NOW(), NOW())
ON CONFLICT DO NOTHING;


-- ============================================================
-- DONE! All tables, indexes, policies, functions, triggers, 
-- storage buckets, and seed data have been created.
-- ============================================================
-- Admin Dashboard: Enterprise Control Center Schema
-- Run this in your Supabase SQL Editor

-- 1. Admin Users (Roles & Permissions)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer', -- super_admin, admin, moderator, support
    status TEXT NOT NULL DEFAULT 'active',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Audit Logs (Track every admin action)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.admin_users(id),
    action TEXT NOT NULL, -- e.g., 'UPDATE_USER', 'DELETE_RIDE'
    target_type TEXT NOT NULL, -- e.g., 'users', 'pins'
    target_id TEXT NOT NULL,
    details JSONB, -- Store what was changed (before/after)
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. API & Security Logs
CREATE TABLE IF NOT EXISTS public.api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    ip_address TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Reports & Moderation
CREATE TABLE IF NOT EXISTS public.user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES auth.users(id),
    target_id UUID, -- Could be user, ride, or comment
    target_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
    assigned_to UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CMS & Content Management
CREATE TABLE IF NOT EXISTS public.cms_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL, -- page, banner, widget
    content JSONB NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    author_id UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. News & Announcements
CREATE TABLE IF NOT EXISTS public.news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'draft', -- draft, published, archived
    author_id UUID REFERENCES public.admin_users(id),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Videos
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'draft',
    author_id UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Notifications Schedule
CREATE TABLE IF NOT EXISTS public.notification_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_audience TEXT NOT NULL, -- all, group_id, role
    status TEXT DEFAULT 'scheduled', -- scheduled, sent, failed
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON public.api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);
-- Add Emergency SOS fields to the profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bike_details TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT;

-- Create ride_events if it doesn't exist (just in case, though it should exist already)
CREATE TABLE IF NOT EXISTS public.ride_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES public.rides(id),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL, -- e.g., 'SOS', 'JOINED', 'LEFT'
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create navigation_sessions table
CREATE TABLE IF NOT EXISTS public.navigation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    origin_lat DOUBLE PRECISION NOT NULL,
    origin_lng DOUBLE PRECISION NOT NULL,
    dest_lat DOUBLE PRECISION NOT NULL,
    dest_lng DOUBLE PRECISION NOT NULL,
    dest_name TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn off RLS initially since the app relies on Firebase Auth and anon key
ALTER TABLE public.navigation_sessions DISABLE ROW LEVEL SECURITY;

-- Create an trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_navigation_sessions_modtime ON public.navigation_sessions;
CREATE TRIGGER update_navigation_sessions_modtime
    BEFORE UPDATE ON public.navigation_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
-- Create saved_locations table for user-defined places (offices, home, etc.)
CREATE TABLE IF NOT EXISTS public.saved_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    location_type TEXT DEFAULT 'custom' CHECK (location_type IN ('home', 'work', 'custom')),
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, name)
);

-- Create index for faster search
CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON public.saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_name ON public.saved_locations(name);

-- Allow users to search and manage their own saved locations
ALTER TABLE public.saved_locations DISABLE ROW LEVEL SECURITY;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_saved_locations_modtime ON public.saved_locations;
CREATE TRIGGER update_saved_locations_modtime
    BEFORE UPDATE ON public.saved_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Permissions for anon and authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_locations TO anon, authenticated;
-- 1. Create CMS Policies Table
CREATE TABLE IF NOT EXISTS public.cms_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('privacy', 'terms')),
  content TEXT NOT NULL,
  version INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for cms_policies
ALTER TABLE public.cms_policies ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published policies
CREATE POLICY "Public can view published policies"
  ON public.cms_policies FOR SELECT
  USING (is_published = true);

-- Allow authenticated admins to manage all policies
CREATE POLICY "Admins can manage policies"
  ON public.cms_policies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- Insert initial dummy records so the app doesn't break
INSERT INTO public.cms_policies (type, content, version, is_published)
VALUES 
('privacy', '# Privacy Policy\n\nInitial version loaded from migration.', 1, true),
('terms', '# Terms & Conditions\n\nInitial version loaded from migration.', 1, true);

-- 2. Modify Profiles Table
-- Add role column if it doesn't exist (assuming it might not exist or needs explicit definition)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='accepted_privacy_version') THEN
    ALTER TABLE public.profiles ADD COLUMN accepted_privacy_version INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='accepted_terms_version') THEN
    ALTER TABLE public.profiles ADD COLUMN accepted_terms_version INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='policy_accepted_at') THEN
    ALTER TABLE public.profiles ADD COLUMN policy_accepted_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_ip_address') THEN
    ALTER TABLE public.profiles ADD COLUMN last_ip_address TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='device_info') THEN
    ALTER TABLE public.profiles ADD COLUMN device_info TEXT;
  END IF;
END $$;

-- Update RLS for profiles to allow users to update their own policy acceptance
-- (Assuming an existing policy allows update on auth.uid()::text = id::text)
-- ============================================================
-- SECURITY & DATA-INTEGRITY HARDENING
-- Date: 2026-07-16
-- Context: QA/security audit found RLS disabled + full anon CRUD grants
--          across nearly every table, plus missing constraints and no
--          atomic transactions for multi-table writes.
--
-- IMPORTANT CONSTRAINT: This app authenticates via Firebase, not Supabase
-- Auth. No Supabase session/JWT is ever established client-side, so
-- auth.uid()/auth.jwt() based RLS (as used transiently in
-- 20260615_admin_rls_policies.sql) does NOT work here — every legitimate
-- app write goes through the anon key directly. Real per-row ownership
-- enforcement therefore CANNOT be done in Postgres today; it requires a
-- backend service that verifies the Firebase ID token and forwards a
-- Supabase-signed JWT (or uses the service_role key from a trusted
-- server). That is out of scope for this migration and is called out
-- explicitly below as follow-up work (see section 1 comments and the
-- final NOTICE block).
--
-- Given that constraint, this migration takes the pragmatic path:
--   1) Re-enable RLS everywhere, but keep permissive SELECT/INSERT/UPDATE/
--      DELETE policies so the app keeps working exactly as before.
--   2) Close the two worst, concretely-fixable holes even without a
--      verified identity: self-promotion to admin (profiles.role) and
--      audit-log tampering (audit_logs must be append-only).
--   3) Fix data-integrity bugs: duplicate ride_members, duplicate
--      profile emails, ride capacity overflow.
--   4) Add atomic RPCs for multi-table ride creation / stop replacement
--      so partial failures can't corrupt data.
--   5) Tighten storage buckets (size/mime limits, authenticated-only
--      writes).
-- ============================================================


-- ============================================================
-- SECTION 1: RE-ENABLE RLS WITH PERMISSIVE POLICIES
-- Fixes audit finding: "RLS disabled and full anon CRUD grants on nearly
-- every table."
--
-- NOTE / FOLLOW-UP: These SELECT/INSERT/UPDATE/DELETE policies are
-- intentionally permissive (USING (true) / WITH CHECK (true)) because
-- Postgres has no way to know which Firebase-authenticated user is
-- making the request — auth.uid()/auth.jwt() are unavailable without a
-- real Supabase session. Real per-row ownership RLS (e.g. "users can
-- only update their own profile/ride/message") requires a backend that
-- verifies the Firebase ID token and either mints a Supabase JWT with
-- the matching `sub` claim, or proxies writes through service_role with
-- server-side ownership checks. Until that exists, RLS here only
-- protects against wholesale disabling of security and gives us a
-- single place to add real ownership predicates later.
-- ============================================================

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'profiles', 'groups', 'group_members', 'messages', 'pins',
        'confirmations', 'alert_views', 'incident_categories',
        'navigation_sessions', 'saved_locations', 'rides', 'ride_members',
        'ride_stops', 'ride_locations', 'ride_events', 'ride_edit_log',
        'vehicle_types', 'stop_types', 'cms_policies', 'cms_content',
        'support_tickets', 'support_messages', 'comments'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        END IF;
    END LOOP;
END $$;

-- Generic permissive policies for every table above EXCEPT audit_logs and
-- error_logs, which get stricter, purpose-built policies in Section 2.
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'groups', 'group_members', 'messages', 'pins',
        'confirmations', 'alert_views', 'incident_categories',
        'navigation_sessions', 'saved_locations', 'rides', 'ride_members',
        'ride_stops', 'ride_locations', 'ride_events',
        'vehicle_types', 'stop_types', 'cms_policies', 'cms_content',
        'support_tickets', 'support_messages', 'comments'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('DROP POLICY IF EXISTS "app_select_%1$s" ON public.%1$I', t);
            EXECUTE format('DROP POLICY IF EXISTS "app_insert_%1$s" ON public.%1$I', t);
            EXECUTE format('DROP POLICY IF EXISTS "app_update_%1$s" ON public.%1$I', t);
            EXECUTE format('DROP POLICY IF EXISTS "app_delete_%1$s" ON public.%1$I', t);

            EXECUTE format('CREATE POLICY "app_select_%1$s" ON public.%1$I FOR SELECT TO anon, authenticated USING (true)', t);
            EXECUTE format('CREATE POLICY "app_insert_%1$s" ON public.%1$I FOR INSERT TO anon, authenticated WITH CHECK (true)', t);
            EXECUTE format('CREATE POLICY "app_update_%1$s" ON public.%1$I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t);
            EXECUTE format('CREATE POLICY "app_delete_%1$s" ON public.%1$I FOR DELETE TO anon, authenticated USING (true)', t);

            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
        END IF;
    END LOOP;
END $$;

-- ride_edit_log already had its own SELECT/INSERT-only policies from
-- 00000000_full_schema.sql; make sure they still exist (idempotent).
DROP POLICY IF EXISTS "Members can view ride edit logs" ON public.ride_edit_log;
DROP POLICY IF EXISTS "Authenticated users can insert ride edit logs" ON public.ride_edit_log;
CREATE POLICY "Members can view ride edit logs" ON public.ride_edit_log FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert ride edit logs" ON public.ride_edit_log FOR INSERT WITH CHECK (true);
GRANT SELECT, INSERT ON public.ride_edit_log TO anon, authenticated;

-- profiles: permissive SELECT/INSERT policies (UPDATE is handled specially
-- below to block role escalation; DELETE stays permissive since the app
-- performs soft-deletes via deleted_at, not hard deletes, but we keep the
-- grant so any legitimate hard-delete path still works).
DROP POLICY IF EXISTS "app_select_profiles" ON public.profiles;
DROP POLICY IF EXISTS "app_insert_profiles" ON public.profiles;
DROP POLICY IF EXISTS "app_update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "app_delete_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins full access to profiles" ON public.profiles;

CREATE POLICY "app_select_profiles" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "app_insert_profiles" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
-- UPDATE is allowed at the RLS layer; the prevent_role_escalation() trigger
-- (Section 2b) is the actual enforcement point that blocks role changes.
CREATE POLICY "app_update_profiles" ON public.profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "app_delete_profiles" ON public.profiles FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated;


-- ============================================================
-- SECTION 2: LOCK DOWN AUDIT_LOGS, ERROR_LOGS, PROFILES.ROLE
-- Fixes audit finding: tamperable audit trail + self-promotion to admin.
-- ============================================================

-- 2a. audit_logs: INSERT-only, ever. No UPDATE/DELETE for anyone via the
-- anon/authenticated roles (only service_role, which bypasses RLS
-- entirely, could remove rows -- e.g. for GDPR erasure via a trusted
-- backend job).
DROP POLICY IF EXISTS "app_select_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "app_insert_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "app_update_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "app_delete_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "audit_logs_insert_only" ON public.audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Deliberately no UPDATE or DELETE policy is created for audit_logs, and
-- the corresponding grants are revoked below, so no anon/authenticated
-- write can ever modify or remove an existing audit row.
REVOKE UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO anon, authenticated;

-- Belt-and-suspenders: trigger that rejects any UPDATE/DELETE attempt on
-- audit_logs even if a future migration accidentally re-grants those
-- privileges or adds a permissive policy.
CREATE OR REPLACE FUNCTION public.prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_tampering ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_tampering
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_audit_log_tampering();

-- 2b. error_logs: keep read/write available to the app (it's how the
-- frontend reports client errors) but at least require RLS is on, and
-- keep SELECT open so admins can view via the Support/Admin dashboard.
DROP POLICY IF EXISTS "app_select_error_logs" ON public.error_logs;
DROP POLICY IF EXISTS "app_insert_error_logs" ON public.error_logs;
DROP POLICY IF EXISTS "app_update_error_logs" ON public.error_logs;
DROP POLICY IF EXISTS "app_delete_error_logs" ON public.error_logs;

CREATE POLICY "error_logs_select" ON public.error_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "error_logs_insert" ON public.error_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "error_logs_update" ON public.error_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
-- error_logs has a `resolved` flag that admins toggle; no legitimate
-- reason for the app to DELETE rows, so no delete policy/grant here.
REVOKE DELETE ON public.error_logs FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.error_logs TO anon, authenticated;

-- 2c. profiles.role: block self-promotion to admin (or any role change)
-- via a BEFORE UPDATE trigger, since we cannot verify caller identity in
-- Postgres. Any legitimate admin-role change must go through a separate,
-- backend-verified admin path (e.g. a service_role script/edge function),
-- which bypasses RLS/triggers is NOT true for triggers -- triggers fire
-- regardless of role, so a genuine admin flow must instead use
-- `SET LOCAL ride_club.allow_role_change = 'true'` in the same
-- transaction (only settable from a trusted backend, never from the
-- anon/authenticated client) to intentionally bypass this guard.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF current_setting('ride_club.allow_role_change', true) IS DISTINCT FROM 'true' THEN
            RAISE EXCEPTION 'Changing profiles.role is not permitted from this connection. Use the admin-verified backend path.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_escalation();


-- ============================================================
-- SECTION 3: DATA-INTEGRITY CONSTRAINTS
-- ============================================================

-- 3a. ride_members: dedupe then add UNIQUE(ride_id, user_id).
-- Fixes: duplicate ride membership rows causing UI/count bugs.
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY ride_id, user_id ORDER BY created_at ASC, id ASC) AS rn
    FROM public.ride_members
)
DELETE FROM public.ride_members
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

ALTER TABLE public.ride_members
    DROP CONSTRAINT IF EXISTS ride_members_ride_id_user_id_key;
ALTER TABLE public.ride_members
    ADD CONSTRAINT ride_members_ride_id_user_id_key UNIQUE (ride_id, user_id);

-- 3b. profiles: dedupe by email (keep admin row if any, else earliest),
-- then add UNIQUE(email). Rows with NULL email are left alone since
-- NULL <> NULL and a UNIQUE constraint allows multiple NULLs.
WITH ranked AS (
    SELECT id, email,
           ROW_NUMBER() OVER (
               PARTITION BY email
               ORDER BY (role = 'admin') DESC, created_at ASC, id ASC
           ) AS rn
    FROM public.profiles
    WHERE email IS NOT NULL
)
DELETE FROM public.profiles
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_email_key;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- 3c. ride_members capacity enforcement against rides.max_riders.
-- Fixes: rides overfilling beyond their stated capacity.
CREATE OR REPLACE FUNCTION public.enforce_ride_capacity()
RETURNS TRIGGER AS $$
DECLARE
    v_max_riders INTEGER;
    v_approved_count INTEGER;
BEGIN
    IF NEW.status = 'approved' THEN
        SELECT max_riders INTO v_max_riders FROM public.rides WHERE id = NEW.ride_id;

        IF v_max_riders IS NOT NULL THEN
            SELECT COUNT(*) INTO v_approved_count
            FROM public.ride_members
            WHERE ride_id = NEW.ride_id
              AND status = 'approved'
              AND id IS DISTINCT FROM NEW.id;

            IF v_approved_count >= v_max_riders THEN
                RAISE EXCEPTION 'Ride % is at capacity (max_riders = %)', NEW.ride_id, v_max_riders;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_ride_capacity ON public.ride_members;
CREATE TRIGGER trg_enforce_ride_capacity
    BEFORE INSERT OR UPDATE OF status ON public.ride_members
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_ride_capacity();


-- ============================================================
-- SECTION 4: ATOMIC RPCs FOR MULTI-TABLE RIDE OPERATIONS
-- Fixes: partial writes across rides/ride_members/ride_stops when the
-- frontend does sequential inserts and one fails midway.
-- ============================================================

-- 4a. Atomically create a ride, add the owner as an approved member, and
-- insert all stops in one transaction.
CREATE OR REPLACE FUNCTION public.create_ride_with_owner(
    ride_data jsonb,
    stops jsonb[]
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_ride_id uuid;
    v_owner_id text;
    v_stop jsonb;
BEGIN
    v_owner_id := ride_data ->> 'owner_id';
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'ride_data.owner_id is required';
    END IF;

    INSERT INTO public.rides (
        ride_code, owner_id, name, description, visibility, max_riders,
        ride_date, vehicle_type, image_url, start_location, destination, status
    )
    VALUES (
        ride_data ->> 'ride_code',
        v_owner_id,
        ride_data ->> 'name',
        ride_data ->> 'description',
        COALESCE(ride_data ->> 'visibility', 'public'),
        COALESCE((ride_data ->> 'max_riders')::int, 50),
        NULLIF(ride_data ->> 'ride_date', '')::timestamptz,
        ride_data ->> 'vehicle_type',
        ride_data ->> 'image_url',
        ride_data -> 'start_location',
        ride_data -> 'destination',
        COALESCE(ride_data ->> 'status', 'scheduled')
    )
    RETURNING id INTO v_ride_id;

    INSERT INTO public.ride_members (ride_id, user_id, role, status, display_name, avatar_url)
    VALUES (
        v_ride_id,
        v_owner_id::uuid,
        'owner',
        'approved',
        ride_data ->> 'owner_display_name',
        ride_data ->> 'owner_avatar_url'
    );

    IF stops IS NOT NULL THEN
        FOREACH v_stop IN ARRAY stops LOOP
            INSERT INTO public.ride_stops (ride_id, stop_name, latitude, longitude, sequence, stop_type)
            VALUES (
                v_ride_id,
                v_stop ->> 'stop_name',
                NULLIF(v_stop ->> 'latitude', '')::double precision,
                NULLIF(v_stop ->> 'longitude', '')::double precision,
                COALESCE((v_stop ->> 'sequence')::int, 0),
                v_stop ->> 'stop_type'
            );
        END LOOP;
    END IF;

    RETURN v_ride_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_ride_with_owner(jsonb, jsonb[]) TO anon, authenticated;

-- 4b. Atomically replace a ride's stops: insert the new stops first, and
-- only delete the old ones after the inserts succeed, so a failure
-- (e.g. a bad row in new_stops) leaves the original stops intact. Both
-- operations run inside this function's implicit transaction, so even
-- the "insert new, then delete old" ordering is fully rolled back
-- together if anything after the inserts fails.
CREATE OR REPLACE FUNCTION public.update_ride_stops(
    p_ride_id uuid,
    new_stops jsonb[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_stop jsonb;
    v_new_ids uuid[] := ARRAY[]::uuid[];
    v_new_id uuid;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.rides WHERE id = p_ride_id) THEN
        RAISE EXCEPTION 'Ride % does not exist', p_ride_id;
    END IF;

    IF new_stops IS NOT NULL THEN
        FOREACH v_stop IN ARRAY new_stops LOOP
            INSERT INTO public.ride_stops (ride_id, stop_name, latitude, longitude, sequence, stop_type)
            VALUES (
                p_ride_id,
                v_stop ->> 'stop_name',
                NULLIF(v_stop ->> 'latitude', '')::double precision,
                NULLIF(v_stop ->> 'longitude', '')::double precision,
                COALESCE((v_stop ->> 'sequence')::int, 0),
                v_stop ->> 'stop_type'
            )
            RETURNING id INTO v_new_id;

            v_new_ids := array_append(v_new_ids, v_new_id);
        END LOOP;
    END IF;

    -- Only now, after all new stops inserted successfully, remove the
    -- old ones (i.e. every ride_stops row for this ride NOT among the
    -- rows we just inserted).
    DELETE FROM public.ride_stops
    WHERE ride_id = p_ride_id
      AND NOT (id = ANY (v_new_ids));
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_ride_stops(uuid, jsonb[]) TO anon, authenticated;


-- ============================================================
-- SECTION 5: STORAGE BUCKET HARDENING
-- Fixes: unlimited file size / arbitrary mime types, fully anonymous
-- writes to storage.objects.
-- ============================================================

UPDATE storage.buckets
SET file_size_limit = 10485760, -- 10 MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id IN ('incident-photos', 'support_attachments', 'Ride Club');

-- Tighten write policies: require an authenticated (Supabase-session)
-- caller rather than fully anonymous access. NOTE: because this app
-- currently only ever calls Supabase with the anon key (Firebase handles
-- app-level auth, not Supabase Auth), the `authenticated` Postgres role
-- is effectively unused today. Restricting these policies to
-- `TO authenticated` closes off anonymous internet write access to
-- storage while a proper backend-verified upload path is designed; if
-- that breaks current uploads because the app truly only has an anon
-- key, this is the follow-up item to pair with real Firebase-token
-- verification (see the note in Section 1).
DROP POLICY IF EXISTS "Anyone can upload photos" ON storage.objects;
CREATE POLICY "Anyone can upload photos" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id IN ('incident-photos', 'support_attachments', 'Ride Club'));

DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
CREATE POLICY "Anyone can view photos" ON storage.objects
    FOR SELECT USING (bucket_id IN ('incident-photos', 'support_attachments', 'Ride Club'));

DROP POLICY IF EXISTS "Anyone can update photos" ON storage.objects;
CREATE POLICY "Anyone can update photos" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id IN ('incident-photos', 'support_attachments', 'Ride Club'));

DROP POLICY IF EXISTS "Anyone can delete photos" ON storage.objects;
CREATE POLICY "Anyone can delete photos" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id IN ('incident-photos', 'support_attachments', 'Ride Club'));

DROP POLICY IF EXISTS "Anyone can upload support images" ON storage.objects;
CREATE POLICY "Anyone can upload support images" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'support_attachments');

DROP POLICY IF EXISTS "Anyone can view support images" ON storage.objects;
CREATE POLICY "Anyone can view support images" ON storage.objects
    FOR SELECT USING (bucket_id = 'support_attachments');


-- ============================================================
-- DONE.
--
-- FOLLOW-UP REQUIRED (not fixed by this migration): real per-row
-- ownership RLS (e.g. "only the ride owner can update this ride", "only
-- the ticket owner or an admin can view a support ticket") is NOT
-- possible today because there is no Supabase-verified identity on the
-- connection -- the app authenticates via Firebase and talks to
-- Supabase with a shared anon key. All policies added here are
-- necessarily permissive (USING (true)) except for the two concrete,
-- enforceable protections added above: audit_logs is now append-only,
-- and profiles.role cannot be changed by a normal client write. Closing
-- the remaining gap requires a backend (Cloud Function / FastAPI
-- endpoint) that verifies the Firebase ID token and either (a) issues a
-- short-lived Supabase JWT with a matching `sub`/custom claim so
-- auth.uid()-based policies work, or (b) proxies sensitive writes through
-- service_role with server-side ownership checks. Track this as a
-- separate migration once that backend piece exists.
-- ============================================================
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

-- We can now use auth.uid() securely because the frontend injects a Custom HS256 JWT
-- signed by the Python backend containing the verified Firebase UID as the 'sub'.

-- Example Policies:
-- Profiles
CREATE POLICY "Allow users to view all active profiles" 
ON public.profiles FOR SELECT USING (status != 'banned');

CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Allow users to insert own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- CMS (Publicly readable, admin editable)
CREATE POLICY "CMS is publicly readable"
ON public.cms_content FOR SELECT USING (true);

-- Rides
CREATE POLICY "Anyone can view active rides"
ON public.rides FOR SELECT USING (true);

CREATE POLICY "Users can create rides"
ON public.rides FOR INSERT WITH CHECK (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can update their own rides"
ON public.rides FOR UPDATE USING (auth.uid()::text = owner_id::text);

