-- Riders can pin places as stops during a live ride; record who added each stop.
ALTER TABLE public.ride_stops ADD COLUMN IF NOT EXISTS added_by_name TEXT;
-- Shared recalculated route so every rider follows the same path after stops change.
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS route_geometry JSONB;
NOTIFY pgrst, 'reload schema';
