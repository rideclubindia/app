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
