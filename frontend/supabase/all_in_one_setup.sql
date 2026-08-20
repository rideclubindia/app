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
      WHERE id = auth.uid() AND role = 'admin'
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
-- (Assuming an existing policy allows update on auth.uid() = id)
-- Account Management RPC Functions
-- Run this in your Supabase SQL Editor

-- Function to safely delete a user account from the client
-- This requires SECURITY DEFINER so it runs with postgres privileges to delete from auth.users
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
BEGIN
  -- Check if the user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete the user from auth.users
  -- Because auth.users is linked to public.profiles via ON DELETE CASCADE (in a standard setup),
  -- this will automatically delete their profile, pins, ride_members, etc.
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Global Audit Logging Triggers
-- Run this in your Supabase SQL Editor

-- 1. Modify the audit_logs table to allow any user (or system) as the actor
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_id_fkey;
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='audit_logs' and column_name='admin_id') THEN
    ALTER TABLE public.audit_logs RENAME COLUMN admin_id TO actor_id;
  END IF;
END $$;

-- 2. Create the generic trigger function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_id UUID;
  v_action TEXT;
  v_target_id TEXT;
  v_details JSONB;
BEGIN
  v_actor_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    v_action := 'CREATE_' || UPPER(TG_TABLE_NAME);
    v_target_id := NEW.id::text;
    v_details := jsonb_build_object('new', row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE_' || UPPER(TG_TABLE_NAME);
    v_target_id := NEW.id::text;
    v_details := jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE_' || UPPER(TG_TABLE_NAME);
    v_target_id := OLD.id::text;
    v_details := jsonb_build_object('old', row_to_json(OLD));
  END IF;

  -- Insert into audit logs, running as SECURITY DEFINER to bypass RLS if needed
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, details)
  VALUES (v_actor_id, v_action, TG_TABLE_NAME, v_target_id, v_details);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Apply the trigger to core tables
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY['profiles', 'pins', 'rides', 'group_members', 'user_reports', 'cms_content'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit_event()', t, t);
  END LOOP;
END $$;
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

-- Incidents
CREATE POLICY "Anyone can view incidents"
ON public.incidents FOR SELECT USING (true);

CREATE POLICY "Users can report incidents"
ON public.incidents FOR INSERT WITH CHECK (auth.uid()::text = reporter_id::text);
-- Add Admin RLS Policies for Confirmations
-- Run this in your Supabase SQL Editor

-- Ensure RLS is enabled
ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;

-- 1. Allow admins to view all confirmations
DROP POLICY IF EXISTS "Admins can view all confirmations" ON public.confirmations;
CREATE POLICY "Admins can view all confirmations"
  ON public.confirmations
  FOR SELECT
  USING (public.is_admin());

-- 2. Allow admins to update all confirmations
DROP POLICY IF EXISTS "Admins can update all confirmations" ON public.confirmations;
CREATE POLICY "Admins can update all confirmations"
  ON public.confirmations
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Allow admins to delete confirmations
DROP POLICY IF EXISTS "Admins can delete all confirmations" ON public.confirmations;
CREATE POLICY "Admins can delete all confirmations"
  ON public.confirmations
  FOR DELETE
  USING (public.is_admin());
-- Add Admin RLS Policies for Profiles
-- Run this in your Supabase SQL Editor

-- 1. Allow admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

-- 2. Allow admins to update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Allow admins to delete profiles
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
CREATE POLICY "Admins can delete all profiles"
  ON public.profiles
  FOR DELETE
  USING (public.is_admin());
-- Enable RLS if not already enabled
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;

-- Create a policy allowing anyone to read published CMS content or app settings
CREATE POLICY "Allow public read access to cms_content"
ON public.cms_content
FOR SELECT
USING (is_published = true OR slug = 'app-settings');
-- Remove strict foreign key constraint from error_logs so we can log errors from unauthenticated users or those in the middle of signing up

ALTER TABLE public.error_logs DROP CONSTRAINT IF EXISTS error_logs_user_id_fkey;
-- Fix RLS policy for error_logs table
-- Allow anyone to insert into error_logs from the frontend

CREATE POLICY "Allow anyone to insert error logs" 
  ON public.error_logs
  FOR INSERT 
  WITH CHECK (true);
-- Fix for row-level security on the public.profiles table
-- Apply this in Supabase SQL Editor for your project.

-- Ensure RLS is enabled on the profiles table.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own profile.
DROP POLICY IF EXISTS "Allow authenticated users to select own profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to select own profiles"
  ON public.profiles
  FOR SELECT
  USING (id::text = auth.uid()::text);

-- Allow authenticated users to insert their own profile row.
DROP POLICY IF EXISTS "Allow authenticated users to insert own profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to insert own profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (id::text = auth.uid()::text);

-- Allow authenticated users to update their own profile row.
DROP POLICY IF EXISTS "Allow authenticated users to update own profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to update own profiles"
  ON public.profiles
  FOR UPDATE
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);
    -- Fix RLS issues for Supabase public tables flagged by the security advisor.
    -- Run this in the Supabase SQL editor for your project.

    -- Enable RLS for the ride-related tables.
    ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.ride_members ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.ride_stops ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.ride_locations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.ride_events ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.ride_chat ENABLE ROW LEVEL SECURITY;

    -- Note: public.spatial_ref_sys is a PostGIS system table and is typically owned by the database service.
    -- In Supabase, you may not have permission to alter or add policies on it from project SQL.
    -- If this remains flagged by the security advisor, review Supabase docs or contact Supabase support.

    -- Rides: owner or ride members may read, update, and delete. Insert only if owner_id matches auth.uid()::uuid.
    DROP POLICY IF EXISTS "Allow authenticated users to select rides" ON public.rides;
    CREATE POLICY "Allow authenticated users to select rides"
    ON public.rides
    FOR SELECT
    USING (
        owner_id = auth.uid()::uuid
        OR EXISTS (
        SELECT 1 FROM public.ride_members rm
        WHERE rm.ride_id = public.rides.id
            AND rm.user_id = auth.uid()::uuid
        )
    );

    DROP POLICY IF EXISTS "Allow authenticated users to update rides" ON public.rides;
    CREATE POLICY "Allow authenticated users to update rides"
    ON public.rides
    FOR UPDATE
    USING (owner_id = auth.uid()::uuid)
    WITH CHECK (owner_id = auth.uid()::uuid);

    DROP POLICY IF EXISTS "Allow authenticated users to delete rides" ON public.rides;
    CREATE POLICY "Allow authenticated users to delete rides"
    ON public.rides
    FOR DELETE
    USING (owner_id = auth.uid()::uuid);

    DROP POLICY IF EXISTS "Allow authenticated users to insert rides" ON public.rides;
    CREATE POLICY "Allow authenticated users to insert rides"
    ON public.rides
    FOR INSERT
    WITH CHECK (owner_id = auth.uid()::uuid);

    -- Ride members: users may manage their own membership records and ride owners may manage members.
    DROP POLICY IF EXISTS "Allow authenticated users to select ride_members" ON public.ride_members;
    CREATE POLICY "Allow authenticated users to select ride_members"
    ON public.ride_members
    FOR SELECT
    USING (
        user_id = auth.uid()::uuid
        OR EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_members.ride_id
            AND r.owner_id = auth.uid()::uuid
        )
    );

    DROP POLICY IF EXISTS "Allow authenticated users to insert ride_members" ON public.ride_members;
    CREATE POLICY "Allow authenticated users to insert ride_members"
    ON public.ride_members
    FOR INSERT
    WITH CHECK (
        auth.uid()::uuid = user_id
        OR EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_members.ride_id
            AND r.owner_id = auth.uid()::uuid
        )
    );

    DROP POLICY IF EXISTS "Allow authenticated users to update ride_members" ON public.ride_members;
    CREATE POLICY "Allow authenticated users to update ride_members"
    ON public.ride_members
    FOR UPDATE
    USING (
        user_id = auth.uid()::uuid
        OR EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_members.ride_id
            AND r.owner_id = auth.uid()::uuid
        )
    )
    WITH CHECK (
        auth.uid()::uuid = user_id
        OR EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_members.ride_id
            AND r.owner_id = auth.uid()::uuid
        )
    );

    DROP POLICY IF EXISTS "Allow authenticated users to delete ride_members" ON public.ride_members;
    CREATE POLICY "Allow authenticated users to delete ride_members"
    ON public.ride_members
    FOR DELETE
    USING (
        user_id = auth.uid()::uuid
        OR EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_members.ride_id
            AND r.owner_id = auth.uid()::uuid
        )
    );

    -- Ride stops: participants can read stops; only ride owner can create/update/delete stops.
    DROP POLICY IF EXISTS "Allow authenticated users to select ride_stops" ON public.ride_stops;
    CREATE POLICY "Allow authenticated users to select ride_stops"
    ON public.ride_stops
    FOR SELECT
    USING (
        EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_stops.ride_id
            AND (r.owner_id = auth.uid()::uuid
                OR EXISTS (
                SELECT 1 FROM public.ride_members rm
                WHERE rm.ride_id = r.id
                    AND rm.user_id = auth.uid()::uuid
                ))
        )
    );

    DROP POLICY IF EXISTS "Allow authenticated users to insert ride_stops" ON public.ride_stops;
    CREATE POLICY "Allow authenticated users to insert ride_stops"
    ON public.ride_stops
    FOR INSERT
    WITH CHECK (
        EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_stops.ride_id
            AND r.owner_id = auth.uid()::uuid
        )
    );

    DROP POLICY IF EXISTS "Allow authenticated users to update ride_stops" ON public.ride_stops;
    CREATE POLICY "Allow authenticated users to update ride_stops"
    ON public.ride_stops
    FOR UPDATE
    USING (
        EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_stops.ride_id
            AND r.owner_id = auth.uid()::uuid
        )
    )
    WITH CHECK (
        EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_stops.ride_id
            AND r.owner_id = auth.uid()::uuid
        )
    );

    DROP POLICY IF EXISTS "Allow authenticated users to delete ride_stops" ON public.ride_stops;
    CREATE POLICY "Allow authenticated users to delete ride_stops"
    ON public.ride_stops
    FOR DELETE
    USING (
        EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_stops.ride_id
            AND r.owner_id = auth.uid()::uuid
        )
    );

    -- Ride locations: participants may read; riders may write their own location.
    DROP POLICY IF EXISTS "Allow authenticated users to select ride_locations" ON public.ride_locations;
    CREATE POLICY "Allow authenticated users to select ride_locations"
    ON public.ride_locations
    FOR SELECT
    USING (
        EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_locations.ride_id
            AND (r.owner_id = auth.uid()::uuid
                OR EXISTS (
                SELECT 1 FROM public.ride_members rm
                WHERE rm.ride_id = r.id
                    AND rm.user_id = auth.uid()::uuid
                ))
        )
    );

    DROP POLICY IF EXISTS "Allow authenticated users to insert ride_locations" ON public.ride_locations;
    CREATE POLICY "Allow authenticated users to insert ride_locations"
    ON public.ride_locations
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()::uuid
        AND EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_locations.ride_id
            AND (r.owner_id = auth.uid()::uuid
                OR EXISTS (
                SELECT 1 FROM public.ride_members rm
                WHERE rm.ride_id = r.id
                    AND rm.user_id = auth.uid()::uuid
                ))
        )
    );

    DROP POLICY IF EXISTS "Allow authenticated users to update ride_locations" ON public.ride_locations;
    CREATE POLICY "Allow authenticated users to update ride_locations"
    ON public.ride_locations
    FOR UPDATE
    USING (
        user_id = auth.uid()::uuid
        AND EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_locations.ride_id
            AND (r.owner_id = auth.uid()::uuid
                OR EXISTS (
                SELECT 1 FROM public.ride_members rm
                WHERE rm.ride_id = r.id
                    AND rm.user_id = auth.uid()::uuid
                ))
        )
    )
    WITH CHECK (
        user_id = auth.uid()::uuid
    );

    DROP POLICY IF EXISTS "Allow authenticated users to delete ride_locations" ON public.ride_locations;
    CREATE POLICY "Allow authenticated users to delete ride_locations"
    ON public.ride_locations
    FOR DELETE
    USING (user_id = auth.uid()::uuid);

    -- Ride events: participants may read and create events.
    DROP POLICY IF EXISTS "Allow authenticated users to select ride_events" ON public.ride_events;
    CREATE POLICY "Allow authenticated users to select ride_events"
    ON public.ride_events
    FOR SELECT
    USING (
        EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_events.ride_id
            AND (r.owner_id = auth.uid()::uuid
                OR EXISTS (
                SELECT 1 FROM public.ride_members rm
                WHERE rm.ride_id = r.id
                    AND rm.user_id = auth.uid()::uuid
                ))
        )
    );

    DROP POLICY IF EXISTS "Allow authenticated users to insert ride_events" ON public.ride_events;
    CREATE POLICY "Allow authenticated users to insert ride_events"
    ON public.ride_events
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()::uuid
        AND EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_events.ride_id
            AND (r.owner_id = auth.uid()::uuid
                OR EXISTS (
                SELECT 1 FROM public.ride_members rm
                WHERE rm.ride_id = r.id
                    AND rm.user_id = auth.uid()::uuid
                ))
        )
    );

    DROP POLICY IF EXISTS "Allow authenticated users to delete ride_events" ON public.ride_events;
    CREATE POLICY "Allow authenticated users to delete ride_events"
    ON public.ride_events
    FOR DELETE
    USING (user_id = auth.uid()::uuid);

    -- Ride chat: participants may read and send messages.
    DROP POLICY IF EXISTS "Allow authenticated users to select ride_chat" ON public.ride_chat;
    CREATE POLICY "Allow authenticated users to select ride_chat"
    ON public.ride_chat
    FOR SELECT
    USING (
        EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_chat.ride_id
            AND (r.owner_id = auth.uid()::uuid
                OR EXISTS (
                SELECT 1 FROM public.ride_members rm
                WHERE rm.ride_id = r.id
                    AND rm.user_id = auth.uid()::uuid
                ))
        )
    );

    DROP POLICY IF EXISTS "Allow authenticated users to insert ride_chat" ON public.ride_chat;
    CREATE POLICY "Allow authenticated users to insert ride_chat"
    ON public.ride_chat
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()::uuid
        AND EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = public.ride_chat.ride_id
            AND (r.owner_id = auth.uid()::uuid
                OR EXISTS (
                SELECT 1 FROM public.ride_members rm
                WHERE rm.ride_id = r.id
                    AND rm.user_id = auth.uid()::uuid
                ))
        )
    );

    DROP POLICY IF EXISTS "Allow authenticated users to delete ride_chat" ON public.ride_chat;
    CREATE POLICY "Allow authenticated users to delete ride_chat"
    ON public.ride_chat
    FOR DELETE
    USING (user_id = auth.uid()::uuid);

    -- Note: public.spatial_ref_sys is a PostGIS system table and may be owned by the database service.
    -- Supabase often prevents altering system tables from project SQL, so this table is skipped here.
    -- If Supabase still flags it, use their dashboard guidance or support to resolve the advisory.
-- Fix for "new row violates row level security policy for ride_members"
-- Run this in your Supabase SQL Editor to allow users to join private rides

-- Drop existing INSERT policy if it exists (change the name if it's different in your dashboard)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.ride_members;
DROP POLICY IF EXISTS "Users can join public rides" ON public.ride_members;

-- Create a new policy that allows a user to insert their own membership record.
-- Since the user must successfully query the `rides` table using the 6-character ride_code 
-- to get the `ride_id` UUID in the first place, we can safely allow the insertion here.
CREATE POLICY "Users can join rides" 
ON public.ride_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
-- 1. Enable insert for anyone (anonymous users on the website)
DROP POLICY IF EXISTS "Enable insert for anyone" ON "public"."website_subscribers";
CREATE POLICY "Enable insert for anyone" ON "public"."website_subscribers" FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable insert for anyone" ON "public"."contact_messages";
CREATE POLICY "Enable insert for anyone" ON "public"."contact_messages" FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 2. Enable read access for authenticated users (your Admin account on the dashboard)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."website_subscribers";
CREATE POLICY "Enable read access for authenticated users" ON "public"."website_subscribers" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."contact_messages";
CREATE POLICY "Enable read access for authenticated users" ON "public"."contact_messages" FOR SELECT TO authenticated USING (true);

-- 3. Enable update/delete access for authenticated users (so you can manage them in Admin panel)
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."website_subscribers";
CREATE POLICY "Enable update for authenticated users" ON "public"."website_subscribers" FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "public"."website_subscribers";
CREATE POLICY "Enable delete for authenticated users" ON "public"."website_subscribers" FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."contact_messages";
CREATE POLICY "Enable update for authenticated users" ON "public"."contact_messages" FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "public"."contact_messages";
CREATE POLICY "Enable delete for authenticated users" ON "public"."contact_messages" FOR DELETE TO authenticated USING (true);
-- For website_subscribers
DROP POLICY IF EXISTS "Enable insert for anyone" ON "public"."website_subscribers";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."website_subscribers";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."website_subscribers";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "public"."website_subscribers";
DROP POLICY IF EXISTS "Enable insert for anyone 2" ON "public"."website_subscribers";
DROP POLICY IF EXISTS "Enable read access for authenticated users 2" ON "public"."website_subscribers";
DROP POLICY IF EXISTS "Enable update for authenticated users 2" ON "public"."website_subscribers";
DROP POLICY IF EXISTS "Enable delete for authenticated users 2" ON "public"."website_subscribers";

CREATE POLICY "Enable insert for anyone 2" ON "public"."website_subscribers" FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Enable read access for authenticated users 2" ON "public"."website_subscribers" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Enable update for authenticated users 2" ON "public"."website_subscribers" FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users 2" ON "public"."website_subscribers" FOR DELETE TO anon, authenticated USING (true);

-- For contact_messages
DROP POLICY IF EXISTS "Enable insert for anyone" ON "public"."contact_messages";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."contact_messages";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."contact_messages";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "public"."contact_messages";
DROP POLICY IF EXISTS "Enable insert for anyone 2" ON "public"."contact_messages";
DROP POLICY IF EXISTS "Enable read access for authenticated users 2" ON "public"."contact_messages";
DROP POLICY IF EXISTS "Enable update for authenticated users 2" ON "public"."contact_messages";
DROP POLICY IF EXISTS "Enable delete for authenticated users 2" ON "public"."contact_messages";

CREATE POLICY "Enable insert for anyone 2" ON "public"."contact_messages" FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Enable read access for authenticated users 2" ON "public"."contact_messages" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Enable update for authenticated users 2" ON "public"."contact_messages" FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users 2" ON "public"."contact_messages" FOR DELETE TO anon, authenticated USING (true);
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
-- Storage RLS Policies for Supabase
-- Run this in your Supabase SQL Editor to secure file uploads

-- Ensure the incident-photos bucket exists with validation
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'incident-photos', 
  'incident-photos', 
  true, 
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Note: RLS is enabled by default on storage.objects.

-- 1. Allow public read access to all incident photos
DROP POLICY IF EXISTS "Public can view incident photos" ON storage.objects;
CREATE POLICY "Public can view incident photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'incident-photos');

-- 2. Allow authenticated users to upload new photos
DROP POLICY IF EXISTS "Authenticated users can upload incident photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload incident photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'incident-photos'
  AND auth.uid() = owner
);

-- 3. Allow users to update their own photos
DROP POLICY IF EXISTS "Users can update their own incident photos" ON storage.objects;
CREATE POLICY "Users can update their own incident photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'incident-photos'
  AND auth.uid() = owner
);

-- 4. Allow users to delete their own photos
DROP POLICY IF EXISTS "Users can delete their own incident photos" ON storage.objects;
CREATE POLICY "Users can delete their own incident photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'incident-photos'
  AND auth.uid() = owner
);
