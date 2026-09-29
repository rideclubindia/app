-- Demo rides around Hyderabad for the pre-launch app, owned by the admin account below.
-- Every row uses ride_code 'DEMO-*'. Remove later with:
--   DELETE FROM public.rides WHERE ride_code LIKE 'DEMO-%';   (members + stops cascade)

BEGIN;

-- Mirrors getDeterministicUuid() in frontend/src/lib/user.ts (JS int32 hash) so membership matches the app.
CREATE OR REPLACE FUNCTION pg_temp.rc_uuid(s TEXT) RETURNS UUID LANGUAGE plpgsql AS $$
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

DO $$
DECLARE
  admin_email CONSTANT TEXT := 'iharsharoyal@gmail.com';
  v_uid TEXT;
  v_name TEXT;
  v_avatar TEXT;
  r RECORD;
  v_ride UUID;
BEGIN
  SELECT id, COALESCE(full_name, split_part(email, '@', 1)), avatar_url
    INTO v_uid, v_name, v_avatar
  FROM public.profiles WHERE lower(email) = admin_email LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No profile found for %. Log into the app once with that account, then re-run.', admin_email;
  END IF;

  DELETE FROM public.rides WHERE ride_code LIKE 'DEMO-%';

  FOR r IN SELECT * FROM (VALUES
    ('DEMO-SUN01', 'Sunday Morning Ride',
     'Easy scenic weekend loop through the heart of the city. Meet at Tank Bund at 6:15 for a quick briefing, chai stop at Necklace Road, and finish with breakfast near Charminar. Full gear mandatory; moderate pace, suitable for all riders.',
     15, interval '2 days 6 hours 30 minutes', 'Any',
     'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&q=70',
     17.4239, 78.4738, 'Tank Bund, Hyderabad', 17.3616, 78.4747, 'Charminar, Hyderabad',
     'Necklace Road Chai Point', 17.4115, 78.4630),
    ('DEMO-HSL02', 'Hussain Sagar Loop',
     'Relaxed city ride around Hussain Sagar lake — perfect for new riders and scooters. Short regroup at Lumbini Park, then a lap past the Buddha statue. Slow pace, no highway sections.',
     20, interval '3 days 7 hours', 'Scooter',
     'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1200&q=70',
     17.4126, 78.4390, 'Banjara Hills, Hyderabad', 17.4239, 78.4738, 'Hussain Sagar, Hyderabad',
     'Lumbini Park', 17.4100, 78.4720),
    ('DEMO-ANH03', 'Ananthagiri Hills Ride',
     'Twisty hill roads and forest views to Ananthagiri. Breakfast halt at Chevella, then the ghat section. Experienced riders only — tank up before the start, limited fuel stations after Chevella.',
     25, interval '5 days 8 hours', 'Motorcycle',
     'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=1200&q=70',
     17.4401, 78.3489, 'Gachibowli, Hyderabad', 17.3170, 77.8580, 'Ananthagiri Hills, Vikarabad',
     'Chevella Breakfast Stop', 17.3067, 78.1353),
    ('DEMO-RFC04', 'Ramoji Film City Run',
     'Half-day highway ride east of the city on NH65. One fuel and water break at Hayathnagar. Steady 70–80 km/h cruise; bring sunscreen and a hydration pack.',
     12, interval '6 days 6 hours', 'Motorcycle',
     'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=1200&q=70',
     17.3457, 78.5522, 'LB Nagar, Hyderabad', 17.2543, 78.6808, 'Ramoji Film City',
     'Hayathnagar Fuel Stop', 17.3290, 78.6040),
    ('DEMO-GOL05', 'Golconda Sunset Cruise',
     'Short evening ride from HITEC City to Golconda Fort to catch the sunset from the ramparts. Photo stop at Durgam Cheruvu bridge on the way. Headlights and reflective gear required for the ride back.',
     10, interval '1 day 17 hours', 'Any',
     'https://images.unsplash.com/photo-1525160354320-d8e92641c563?w=1200&q=70',
     17.4435, 78.3772, 'HITEC City, Hyderabad', 17.3833, 78.4011, 'Golconda Fort, Hyderabad',
     'Durgam Cheruvu Bridge', 17.4300, 78.3890)
  ) AS v(code, name, descr, max_r, offs, vehicle, img, slat, slng, sname, dlat, dlng, dname, mname, mlat, mlng)
  LOOP
    INSERT INTO public.rides (ride_code, owner_id, name, description, visibility, max_riders, ride_date,
                              vehicle_type, image_url, start_location, destination, status, version)
    VALUES (r.code, v_uid, r.name, r.descr, 'public', r.max_r, date_trunc('day', now()) + r.offs,
            r.vehicle, r.img,
            jsonb_build_object('lat', r.slat, 'lng', r.slng, 'name', r.sname),
            jsonb_build_object('lat', r.dlat, 'lng', r.dlng, 'name', r.dname),
            'scheduled', 1)
    RETURNING id INTO v_ride;

    INSERT INTO public.ride_stops (ride_id, stop_name, latitude, longitude, sequence, stop_type) VALUES
      (v_ride, r.sname, r.slat, r.slng, 0, 'Start'),
      (v_ride, r.mname, r.mlat, r.mlng, 1, 'Stop'),
      (v_ride, r.dname, r.dlat, r.dlng, 2, 'Destination');

    INSERT INTO public.ride_members (ride_id, user_id, role, status, display_name, avatar_url)
    VALUES (v_ride, pg_temp.rc_uuid(v_uid), 'admin', 'approved', v_name,
            COALESCE(v_avatar, 'https://ui-avatars.com/api/?background=ff6b22&color=fff&name=' || replace(v_name, ' ', '+')));

    INSERT INTO public.ride_members (ride_id, user_id, role, status, display_name, avatar_url)
    SELECT v_ride, gen_random_uuid(), 'rider', 'approved', m.n,
           'https://ui-avatars.com/api/?background=1f2430&color=fff&name=' || replace(m.n, ' ', '+')
    FROM (VALUES ('Priya Sharma'), ('Karthik Rao'), ('Sneha Iyer'), ('Rahul Verma'), ('Divya Nair'), ('Vikram Singh')) AS m(n)
    WHERE random() < 0.8;
  END LOOP;
END $$;

COMMIT;
