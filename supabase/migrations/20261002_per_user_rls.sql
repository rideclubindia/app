-- Per-user RLS: the backend issues a short-lived Supabase JWT (sub = profile id, uid = login uid, app_role) per rider.
-- Replaces the blanket "true" policies so the public key alone no longer reads or writes private data.

CREATE OR REPLACE FUNCTION public.rc_claim(k TEXT) RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> k, '')
$$;

CREATE OR REPLACE FUNCTION public.rc_is_me(x TEXT) RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT x IS NOT NULL AND x <> '' AND (x = public.rc_claim('sub') OR x = public.rc_claim('uid'))
$$;

CREATE OR REPLACE FUNCTION public.rc_is_admin() RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT public.rc_claim('app_role') = 'admin'
$$;

CREATE OR REPLACE FUNCTION public.rc_in_ride(r UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM rides WHERE id = r AND public.rc_is_me(owner_id))
      OR EXISTS (SELECT 1 FROM ride_members WHERE ride_id = r AND public.rc_is_me(user_id::text)
                 AND COALESCE(status, 'approved') NOT IN ('pending', 'rejected', 'removed', 'left'))
$$;

CREATE OR REPLACE FUNCTION public.rc_owns_ride(r UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM rides WHERE id = r AND public.rc_is_me(owner_id))
$$;

CREATE OR REPLACE FUNCTION public.rc_ride_is_public(r UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM rides WHERE id = r AND COALESCE(visibility, 'public') = 'public')
$$;

CREATE OR REPLACE FUNCTION public.rc_in_group(g UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM groups WHERE id = g AND public.rc_is_me(admin_id::text))
      OR EXISTS (SELECT 1 FROM group_members WHERE group_id = g AND public.rc_is_me(user_id::text) AND COALESCE(status, 'accepted') = 'accepted')
$$;

CREATE OR REPLACE FUNCTION public.rc_group_admin(g UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM groups WHERE id = g AND public.rc_is_me(admin_id::text))
$$;

CREATE OR REPLACE FUNCTION public.rc_group_is_public(g UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM groups WHERE id = g AND NOT COALESCE(is_private, false))
$$;

-- Drop every existing policy on the tables below, then rebuild
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN (
    'rides','ride_members','ride_locations','ride_events','ride_stops','ride_edit_log','groups','group_members','messages',
    'saved_locations','navigation_sessions','pins','confirmations','alert_views','support_tickets','support_messages',
    'cms_content','cms_policies','incident_categories','stop_types','vehicle_types','audit_logs','error_logs',
    'contact_messages','website_subscribers','profiles')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['rides','ride_members','ride_locations','ride_events','ride_stops','ride_edit_log','groups','group_members','messages',
    'saved_locations','navigation_sessions','pins','confirmations','alert_views','support_tickets','support_messages','cms_content','cms_policies',
    'incident_categories','stop_types','vehicle_types','audit_logs','error_logs','contact_messages','website_subscribers','profiles',
    'sos_events','sos_event_audit_log','crash_events','admin_users','api_logs','navigations','news_articles','notification_schedules','user_reports','videos']
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END $$;
REVOKE ALL ON public.alembic_version FROM anon, authenticated;

-- Profiles: display-safe columns only; private fields via the backend
GRANT SELECT (id, full_name, avatar_url, status, created_at, deleted_at) ON public.profiles TO anon, authenticated;
CREATE POLICY rc_profiles_read ON public.profiles FOR SELECT TO anon, authenticated USING (true);

-- Rides: public rides are discoverable; private rides only to owner/members; admins see all
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rides TO authenticated;
CREATE POLICY rc_rides_read ON public.rides FOR SELECT TO authenticated
  USING (COALESCE(visibility, 'public') = 'public' OR public.rc_is_me(owner_id) OR public.rc_in_ride(id) OR public.rc_is_admin());
CREATE POLICY rc_rides_insert ON public.rides FOR INSERT TO authenticated WITH CHECK (public.rc_is_me(owner_id));
CREATE POLICY rc_rides_update ON public.rides FOR UPDATE TO authenticated
  USING (public.rc_is_me(owner_id) OR public.rc_is_admin()) WITH CHECK (public.rc_is_me(owner_id) OR public.rc_is_admin());
CREATE POLICY rc_rides_delete ON public.rides FOR DELETE TO authenticated USING (public.rc_is_me(owner_id) OR public.rc_is_admin());

-- Ride members: visible to members of the ride (and for public rides); self-join public rides; owner manages
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_members TO authenticated;
CREATE POLICY rc_rm_read ON public.ride_members FOR SELECT TO authenticated
  USING (public.rc_is_me(user_id::text) OR public.rc_in_ride(ride_id) OR public.rc_ride_is_public(ride_id) OR public.rc_is_admin());
CREATE POLICY rc_rm_insert ON public.ride_members FOR INSERT TO authenticated
  WITH CHECK ((public.rc_is_me(user_id::text) AND (public.rc_ride_is_public(ride_id) OR public.rc_owns_ride(ride_id))) OR public.rc_owns_ride(ride_id));
CREATE POLICY rc_rm_update ON public.ride_members FOR UPDATE TO authenticated
  USING (public.rc_owns_ride(ride_id) OR public.rc_is_admin()) WITH CHECK (public.rc_owns_ride(ride_id) OR public.rc_is_admin());
CREATE POLICY rc_rm_delete ON public.ride_members FOR DELETE TO authenticated
  USING (public.rc_is_me(user_id::text) OR public.rc_owns_ride(ride_id) OR public.rc_is_admin());

-- Live locations: only riders in the same ride; each rider writes only their own row
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_locations TO authenticated;
CREATE POLICY rc_loc_read ON public.ride_locations FOR SELECT TO authenticated USING (public.rc_in_ride(ride_id) OR public.rc_is_admin());
CREATE POLICY rc_loc_insert ON public.ride_locations FOR INSERT TO authenticated WITH CHECK (public.rc_is_me(user_id::text) AND public.rc_in_ride(ride_id));
CREATE POLICY rc_loc_update ON public.ride_locations FOR UPDATE TO authenticated
  USING (public.rc_is_me(user_id::text)) WITH CHECK (public.rc_is_me(user_id::text) AND public.rc_in_ride(ride_id));
CREATE POLICY rc_loc_delete ON public.ride_locations FOR DELETE TO authenticated USING (public.rc_is_me(user_id::text) OR public.rc_owns_ride(ride_id));

-- Ride events (SOS, updates), stops and edit log: ride members only
GRANT SELECT, INSERT ON public.ride_events TO authenticated;
CREATE POLICY rc_evt_read ON public.ride_events FOR SELECT TO authenticated USING (public.rc_in_ride(ride_id) OR public.rc_is_admin());
CREATE POLICY rc_evt_insert ON public.ride_events FOR INSERT TO authenticated WITH CHECK (public.rc_is_me(user_id::text) AND public.rc_in_ride(ride_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_stops TO authenticated;
CREATE POLICY rc_stops_read ON public.ride_stops FOR SELECT TO authenticated
  USING (public.rc_in_ride(ride_id) OR public.rc_ride_is_public(ride_id) OR public.rc_is_admin());
CREATE POLICY rc_stops_write ON public.ride_stops FOR ALL TO authenticated
  USING (public.rc_in_ride(ride_id) OR public.rc_is_admin()) WITH CHECK (public.rc_in_ride(ride_id) OR public.rc_is_admin());

GRANT SELECT, INSERT ON public.ride_edit_log TO authenticated;
CREATE POLICY rc_editlog_read ON public.ride_edit_log FOR SELECT TO authenticated USING (public.rc_in_ride(ride_id) OR public.rc_is_admin());
CREATE POLICY rc_editlog_insert ON public.ride_edit_log FOR INSERT TO authenticated WITH CHECK (public.rc_is_me(editor_id) AND public.rc_in_ride(ride_id));

-- Groups: private groups hidden from non-members; passcode column never readable by clients
GRANT SELECT (id, name, admin_id, radius, is_private, pinned_message_id, created_at) ON public.groups TO authenticated;
GRANT INSERT, DELETE ON public.groups TO authenticated;
GRANT UPDATE (name, radius, pinned_message_id) ON public.groups TO authenticated;
CREATE POLICY rc_groups_read ON public.groups FOR SELECT TO authenticated
  USING (NOT COALESCE(is_private, false) OR public.rc_in_group(id) OR public.rc_is_admin());
CREATE POLICY rc_groups_insert ON public.groups FOR INSERT TO authenticated WITH CHECK (public.rc_is_me(admin_id::text));
CREATE POLICY rc_groups_update ON public.groups FOR UPDATE TO authenticated
  USING (public.rc_is_me(admin_id::text) OR public.rc_is_admin()) WITH CHECK (public.rc_is_me(admin_id::text) OR public.rc_is_admin());
CREATE POLICY rc_groups_delete ON public.groups FOR DELETE TO authenticated USING (public.rc_is_me(admin_id::text) OR public.rc_is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
CREATE POLICY rc_gm_read ON public.group_members FOR SELECT TO authenticated
  USING (public.rc_is_me(user_id::text) OR public.rc_in_group(group_id) OR public.rc_group_is_public(group_id) OR public.rc_is_admin());
CREATE POLICY rc_gm_insert ON public.group_members FOR INSERT TO authenticated
  WITH CHECK ((public.rc_is_me(user_id::text) AND public.rc_group_is_public(group_id)) OR public.rc_group_admin(group_id) OR public.rc_is_admin());
CREATE POLICY rc_gm_update ON public.group_members FOR UPDATE TO authenticated
  USING (public.rc_is_me(user_id::text) OR public.rc_group_admin(group_id) OR public.rc_is_admin())
  WITH CHECK (public.rc_is_me(user_id::text) OR public.rc_group_admin(group_id) OR public.rc_is_admin());
CREATE POLICY rc_gm_delete ON public.group_members FOR DELETE TO authenticated
  USING (public.rc_is_me(user_id::text) OR public.rc_group_admin(group_id) OR public.rc_is_admin());

-- Messages: group members only; senders post as themselves
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
CREATE POLICY rc_msg_read ON public.messages FOR SELECT TO authenticated USING (public.rc_in_group(group_id) OR public.rc_is_admin());
CREATE POLICY rc_msg_insert ON public.messages FOR INSERT TO authenticated
  WITH CHECK ((public.rc_is_me(user_id::text) AND public.rc_in_group(group_id)) OR public.rc_is_admin());
CREATE POLICY rc_msg_update ON public.messages FOR UPDATE TO authenticated
  USING (public.rc_is_me(user_id::text) OR public.rc_group_admin(group_id) OR public.rc_is_admin())
  WITH CHECK (public.rc_in_group(group_id) OR public.rc_is_admin());
CREATE POLICY rc_msg_delete ON public.messages FOR DELETE TO authenticated
  USING (public.rc_is_me(user_id::text) OR public.rc_group_admin(group_id) OR public.rc_is_admin());

-- Join a private group: passcode checked in the database, never sent to the client
CREATE OR REPLACE FUNCTION public.rc_join_group(p_group UUID, p_passcode TEXT, p_username TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g RECORD; me TEXT := public.rc_claim('sub');
BEGIN
  IF me = '' THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT id, is_private, passcode INTO g FROM groups WHERE id = p_group;
  IF NOT FOUND THEN RETURN false; END IF;
  IF COALESCE(g.is_private, false) AND COALESCE(g.passcode, '') <> COALESCE(p_passcode, '') THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM group_members WHERE group_id = p_group AND public.rc_is_me(user_id::text)) THEN
    INSERT INTO group_members (group_id, user_id, username, status) VALUES (p_group, me, LEFT(COALESCE(p_username, 'Rider'), 60), 'accepted');
  END IF;
  RETURN true;
END $$;

-- Find a group by exact id without exposing private groups' passcode or members
CREATE OR REPLACE FUNCTION public.rc_find_group(p_group UUID)
RETURNS TABLE (id UUID, name TEXT, is_private BOOLEAN, member_count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.id, g.name, COALESCE(g.is_private, false), (SELECT count(*) FROM group_members m WHERE m.group_id = g.id)
  FROM groups g WHERE g.id = p_group AND public.rc_claim('sub') <> ''
$$;

-- Only the group admin can read the passcode (for invites)
CREATE OR REPLACE FUNCTION public.rc_group_passcode(p_group UUID) RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT passcode FROM groups WHERE id = p_group AND (public.rc_is_me(admin_id::text) OR public.rc_is_admin())
$$;

-- Look up a ride by its share code (works for private rides, returns only card fields)
CREATE OR REPLACE FUNCTION public.rc_find_ride_by_code(p_code TEXT)
RETURNS TABLE (id UUID, name TEXT, ride_code TEXT, status TEXT, ride_date TIMESTAMPTZ, start_location JSONB, destination JSONB, max_riders INT, vehicle_type TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.name, r.ride_code, r.status, r.ride_date, r.start_location, r.destination, r.max_riders, r.vehicle_type
  FROM rides r WHERE upper(r.ride_code) = upper(trim(p_code)) AND public.rc_claim('sub') <> '' LIMIT 1
$$;

-- Join a ride by its share code (the code is the invitation for private rides)
CREATE OR REPLACE FUNCTION public.rc_join_ride_by_code(p_code TEXT, p_display_name TEXT, p_avatar TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; me TEXT := public.rc_claim('sub');
BEGIN
  IF me = '' THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT id, status INTO r FROM rides WHERE upper(ride_code) = upper(trim(p_code)) LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF r.status IN ('ended', 'completed', 'cancelled') THEN RAISE EXCEPTION 'RIDE_CLOSED'; END IF;
  IF NOT EXISTS (SELECT 1 FROM ride_members WHERE ride_id = r.id AND public.rc_is_me(user_id::text)) THEN
    INSERT INTO ride_members (ride_id, user_id, role, status, display_name, avatar_url)
    VALUES (r.id, me::uuid, 'rider', 'approved', LEFT(COALESCE(p_display_name, 'Rider'), 60), p_avatar);
  END IF;
  RETURN r.id;
END $$;

REVOKE ALL ON FUNCTION public.rc_join_group(UUID, TEXT, TEXT), public.rc_find_group(UUID), public.rc_group_passcode(UUID),
  public.rc_find_ride_by_code(TEXT), public.rc_join_ride_by_code(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rc_join_group(UUID, TEXT, TEXT), public.rc_find_group(UUID), public.rc_group_passcode(UUID),
  public.rc_find_ride_by_code(TEXT), public.rc_join_ride_by_code(TEXT, TEXT, TEXT) TO authenticated;

-- Personal places and navigation history: owner only (admins may read navigation sessions)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_locations TO authenticated;
CREATE POLICY rc_saved_own ON public.saved_locations FOR ALL TO authenticated
  USING (public.rc_is_me(user_id::text)) WITH CHECK (public.rc_is_me(user_id::text));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.navigation_sessions TO authenticated;
CREATE POLICY rc_nav_read ON public.navigation_sessions FOR SELECT TO authenticated USING (public.rc_is_me(user_id::text) OR public.rc_is_admin());
CREATE POLICY rc_nav_write ON public.navigation_sessions FOR ALL TO authenticated
  USING (public.rc_is_me(user_id::text) OR public.rc_is_admin()) WITH CHECK (public.rc_is_me(user_id::text) OR public.rc_is_admin());

-- Hazard pins are community safety data: readable by riders, editable by admins; reports go in as the reporter
GRANT SELECT, INSERT ON public.pins TO authenticated;
GRANT UPDATE, DELETE ON public.pins TO authenticated;
CREATE POLICY rc_pins_read ON public.pins FOR SELECT TO authenticated USING (true);
CREATE POLICY rc_pins_insert ON public.pins FOR INSERT TO authenticated WITH CHECK (reporter_id IS NULL OR public.rc_is_me(reporter_id::text) OR public.rc_is_admin());
CREATE POLICY rc_pins_admin ON public.pins FOR UPDATE TO authenticated USING (public.rc_is_admin()) WITH CHECK (public.rc_is_admin());
CREATE POLICY rc_pins_delete ON public.pins FOR DELETE TO authenticated USING (public.rc_is_admin() OR public.rc_is_me(reporter_id::text));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.confirmations, public.alert_views TO authenticated;
CREATE POLICY rc_conf_read ON public.confirmations FOR SELECT TO authenticated USING (true);
CREATE POLICY rc_conf_write ON public.confirmations FOR INSERT TO authenticated WITH CHECK (public.rc_is_me(user_id::text));
CREATE POLICY rc_conf_own ON public.confirmations FOR DELETE TO authenticated USING (public.rc_is_me(user_id::text) OR public.rc_is_admin());
CREATE POLICY rc_views_own ON public.alert_views FOR ALL TO authenticated USING (public.rc_is_me(user_id::text)) WITH CHECK (public.rc_is_me(user_id::text));

-- Support: riders see their own tickets; admins see all
GRANT SELECT, INSERT, UPDATE ON public.support_tickets, public.support_messages TO authenticated;
CREATE POLICY rc_tickets_read ON public.support_tickets FOR SELECT TO authenticated USING (public.rc_is_me(user_id::text) OR public.rc_is_admin());
CREATE POLICY rc_tickets_insert ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (public.rc_is_me(user_id::text));
CREATE POLICY rc_tickets_admin ON public.support_tickets FOR UPDATE TO authenticated USING (public.rc_is_admin()) WITH CHECK (public.rc_is_admin());
CREATE OR REPLACE FUNCTION public.rc_owns_ticket(t UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM support_tickets WHERE id = t AND public.rc_is_me(user_id::text))
$$;
CREATE POLICY rc_supmsg_read ON public.support_messages FOR SELECT TO authenticated USING (public.rc_owns_ticket(ticket_id) OR public.rc_is_admin());
CREATE POLICY rc_supmsg_insert ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK ((public.rc_owns_ticket(ticket_id) AND public.rc_is_me(sender_id::text) AND NOT COALESCE(is_admin, false)) OR public.rc_is_admin());

-- Reference and CMS content: public read, admin write
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['cms_content','cms_policies','incident_categories','stop_types','vehicle_types'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('CREATE POLICY rc_%s_read ON public.%I FOR SELECT TO anon, authenticated USING (true)', t, t);
    EXECUTE format('CREATE POLICY rc_%s_admin ON public.%I FOR ALL TO authenticated USING (public.rc_is_admin()) WITH CHECK (public.rc_is_admin())', t, t);
  END LOOP;
END $$;

-- Write-only inboxes; admins read
GRANT INSERT ON public.contact_messages, public.website_subscribers, public.error_logs TO anon, authenticated;
GRANT SELECT ON public.contact_messages, public.website_subscribers TO authenticated;
GRANT SELECT, UPDATE ON public.error_logs TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
CREATE POLICY rc_contact_insert ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY rc_contact_admin ON public.contact_messages FOR SELECT TO authenticated USING (public.rc_is_admin());
CREATE POLICY rc_subs_insert ON public.website_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY rc_subs_admin ON public.website_subscribers FOR SELECT TO authenticated USING (public.rc_is_admin());
CREATE POLICY rc_errors_insert ON public.error_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY rc_errors_admin ON public.error_logs FOR SELECT TO authenticated USING (public.rc_is_admin());
CREATE POLICY rc_errors_admin_upd ON public.error_logs FOR UPDATE TO authenticated USING (public.rc_is_admin()) WITH CHECK (public.rc_is_admin());
CREATE POLICY rc_audit_admin ON public.audit_logs FOR ALL TO authenticated USING (public.rc_is_admin()) WITH CHECK (public.rc_is_admin());

-- Realtime would otherwise stream whole profile rows
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
  END IF;
END $$;

-- Location retention: live positions are only needed while riding
CREATE OR REPLACE FUNCTION public.rc_purge_stale_locations() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM ride_locations l USING rides r
  WHERE l.ride_id = r.id AND (r.status IN ('ended', 'completed', 'cancelled') OR l.updated_at < now() - interval '2 days');
$$;
REVOKE ALL ON FUNCTION public.rc_purge_stale_locations() FROM PUBLIC, anon, authenticated;
