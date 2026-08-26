-- Real-time platform support: unique conflict target for batched
-- location upserts written by backend/realtime/location_pipeline.py
-- and by the Navigation page's Supabase upsert (onConflict: 'ride_id,user_id').

CREATE UNIQUE INDEX IF NOT EXISTS uq_ride_locations_ride_user
    ON public.ride_locations (ride_id, user_id);

-- Critical-event stream consumers benefit from an ordered scan by time.
CREATE INDEX IF NOT EXISTS idx_ride_events_ride_created
    ON public.ride_events (ride_id, created_at DESC);
