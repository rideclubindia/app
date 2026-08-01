-- 1. Create alert_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.alert_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- references profiles/auth but we leave it loose for flexibility
    viewed_at BIGINT NOT NULL,
    UNIQUE(pin_id, user_id)
);

-- 2. Disable RLS and grant access for Firebase clients
ALTER TABLE public.alert_views DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_views TO anon, authenticated;

-- 3. Trigger to clean up alert_views when pin becomes inactive
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

-- 4. Function to manually or scheduled clean up expired alert_views (12 hours)
CREATE OR REPLACE FUNCTION public.cleanup_expired_alert_views()
RETURNS void AS $$
BEGIN
    -- Delete alert_views older than 12 hours (43200000 ms)
    DELETE FROM public.alert_views
    WHERE viewed_at < (EXTRACT(EPOCH FROM NOW()) * 1000) - 43200000;
END;
$$ LANGUAGE plpgsql;
