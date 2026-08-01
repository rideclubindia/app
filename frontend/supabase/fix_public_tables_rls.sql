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
