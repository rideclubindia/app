-- A rider can be identified by their profile id (sub), login uid (uid) or the id the app derives from uid (mid).
-- Older accounts were created with a profile id that differs from mid, so all three must count as "me".
CREATE OR REPLACE FUNCTION public.rc_is_me(x TEXT) RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT x IS NOT NULL AND x <> '' AND (x = public.rc_claim('sub') OR x = public.rc_claim('uid') OR x = public.rc_claim('mid'))
$$;
