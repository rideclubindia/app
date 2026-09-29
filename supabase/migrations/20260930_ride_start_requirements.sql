-- Server-side enforcement for starting a ride: the owner needs an emergency contact with a valid mobile number,
-- and can only have one live ride at a time. Runs on every insert/update of rides.status to 'live'.

-- Mirrors getDeterministicUuid() in frontend/src/lib/user.ts (JS int32 hash) to map an owner id to their profile id
CREATE OR REPLACE FUNCTION public.rc_member_uuid(s TEXT) RETURNS UUID LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  h BIGINT := 0;
  i INT;
  t BIGINT;
BEGIN
  FOR i IN 1..length(s) LOOP
    t := ((h % 4294967296) + 4294967296) % 4294967296;
    IF t >= 2147483648 THEN t := t - 4294967296; END IF;
    t := ((t * 32) % 4294967296 + 4294967296) % 4294967296;
    IF t >= 2147483648 THEN t := t - 4294967296; END IF;
    h := ascii(substr(s, i, 1)) + t - h;
  END LOOP;
  RETURN ('00000000-0000-0000-0000-' || lpad(to_hex(abs(h)), 12, '0'))::UUID;
END $$;

CREATE OR REPLACE FUNCTION public.rc_enforce_ride_start() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_profile UUID;
  v_contact TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM 'live' OR (TG_OP = 'UPDATE' AND OLD.status = 'live') THEN
    RETURN NEW;
  END IF;

  v_profile := CASE WHEN NEW.owner_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                    THEN NEW.owner_id::text::uuid ELSE public.rc_member_uuid(NEW.owner_id::text) END;
  SELECT emergency_contact INTO v_contact FROM profiles WHERE id = v_profile;

  -- At least 10 digits (Indian mobile, optionally with country code)
  IF v_contact IS NULL OR length(regexp_replace(v_contact, '\D', '', 'g')) < 10 THEN
    RAISE EXCEPTION 'EMERGENCY_CONTACT_REQUIRED: add an emergency contact with a mobile number before starting a ride'
      USING ERRCODE = 'check_violation';
  END IF;

  IF EXISTS (
    SELECT 1 FROM rides r
    WHERE r.owner_id::text = NEW.owner_id::text AND r.status = 'live' AND r.id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'ALREADY_IN_LIVE_RIDE: end your current live ride before starting another'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rc_enforce_ride_start ON public.rides;
CREATE TRIGGER rc_enforce_ride_start
  BEFORE INSERT OR UPDATE OF status ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.rc_enforce_ride_start();
