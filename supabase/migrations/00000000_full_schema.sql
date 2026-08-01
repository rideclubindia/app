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
