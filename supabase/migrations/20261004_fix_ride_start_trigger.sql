-- Fix: profiles.id is TEXT, so the uuid must be cast before comparing (the original blocked every ride start)
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
  SELECT emergency_contact INTO v_contact FROM profiles WHERE id = v_profile::text;

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

