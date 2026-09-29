import json
import pathlib
import uuid

import pytest
from sqlalchemy import text

from core.database import engine

MIGRATION = pathlib.Path(__file__).resolve().parents[2] / "supabase" / "migrations" / "20261002_per_user_rls.sql"

A = {"sub": "00000000-0000-0000-0000-00000000a0a0", "uid": "testuid_rider_a", "app_role": "rider"}
B = {"sub": "00000000-0000-0000-0000-00000000b0b0", "uid": "testuid_rider_b", "app_role": "rider"}
ADMIN = {"sub": "00000000-0000-0000-0000-00000000adad", "uid": "testuid_admin", "app_role": "admin"}


@pytest.fixture
def cur():
    # Everything runs in one transaction that is always rolled back: migration, fixtures and attacks
    conn = engine.raw_connection()
    c = conn.cursor()
    try:
        c.execute(MIGRATION.read_text(encoding="utf-8"))
    except Exception as e:  # pragma: no cover
        conn.rollback()
        pytest.skip(f"database unavailable: {e}")
    yield c
    conn.rollback()
    conn.close()


def as_user(c, claims):
    c.execute("RESET ROLE")
    if claims is None:
        c.execute("SET LOCAL ROLE anon")
        c.execute("SELECT set_config('request.jwt.claims', '', true)")
    else:
        c.execute("SET LOCAL ROLE authenticated")
        c.execute("SELECT set_config('request.jwt.claims', %s, true)", (json.dumps({**claims, "role": "authenticated"}),))


def as_postgres(c):
    c.execute("RESET ROLE")


def rows(c, sql, *args):
    c.execute("SAVEPOINT q")
    try:
        c.execute(sql, args)
        out = c.fetchall()
        c.execute("RELEASE SAVEPOINT q")
        return out
    except Exception:
        c.execute("ROLLBACK TO SAVEPOINT q")
        return None


def write(c, sql, *args):
    c.execute("SAVEPOINT w")
    try:
        c.execute(sql, args)
        n = c.rowcount
        c.execute("RELEASE SAVEPOINT w")
        return n
    except Exception:
        c.execute("ROLLBACK TO SAVEPOINT w")
        return None


@pytest.fixture
def world(cur):
    # Rider A owns a private live ride with a live location and SOS; A has a private group, a saved home and a ticket
    as_postgres(cur)
    ride, group, ticket = str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())
    for p in (A, B, ADMIN):
        cur.execute("INSERT INTO profiles (id, full_name, email, emergency_contact, blood_group, status) VALUES (%s, 'T', %s, '+919999999999 (Mom)', 'O+', 'active')",
                    (p["sub"], p["uid"] + "@test.invalid"))
    cur.execute("INSERT INTO rides (id, ride_code, owner_id, name, visibility, status) VALUES (%s, 'TSTPRV', %s, 'Private test', 'private', 'scheduled')", (ride, A["uid"]))
    cur.execute("INSERT INTO ride_members (ride_id, user_id, role, status) VALUES (%s, %s, 'leader', 'approved')", (ride, A["sub"]))
    cur.execute("INSERT INTO ride_locations (ride_id, user_id, latitude, longitude) VALUES (%s, %s, 17.4, 78.4)", (ride, A["sub"]))
    cur.execute("INSERT INTO ride_events (ride_id, user_id, event_type, description) VALUES (%s, %s, 'SOS', 'help')", (ride, A["uid"]))
    cur.execute("INSERT INTO groups (id, name, admin_id, is_private, passcode) VALUES (%s, 'Secret', %s, true, '4321')", (group, A["uid"]))
    cur.execute("INSERT INTO group_members (group_id, user_id, username, status) VALUES (%s, %s, 'A', 'accepted')", (group, A["uid"]))
    cur.execute("INSERT INTO messages (group_id, user_id, username, content) VALUES (%s, %s, 'A', 'private hello')", (group, A["sub"]))
    cur.execute("INSERT INTO saved_locations (user_id, name, latitude, longitude, location_type) VALUES (%s, 'Home', 17.1, 78.1, 'home')", (A["uid"],))
    cur.execute("INSERT INTO navigation_sessions (user_id, origin_lat, origin_lng, dest_lat, dest_lng, dest_name, status) VALUES (%s, 1, 1, 2, 2, 'Work', 'completed')", (A["sub"],))
    cur.execute("INSERT INTO support_tickets (id, user_id, user_name, category, status, description) VALUES (%s, %s, 'A', 'x', 'open', 'my issue')", (ticket, A["sub"]))
    return {"ride": ride, "group": group, "ticket": ticket}


def test_other_rider_cannot_read_live_location(cur, world):
    as_user(cur, B)
    assert rows(cur, "SELECT * FROM ride_locations WHERE ride_id = %s", world["ride"]) == []
    as_user(cur, A)
    assert len(rows(cur, "SELECT * FROM ride_locations WHERE ride_id = %s", world["ride"])) == 1


def test_anonymous_gets_nothing_private(cur, world):
    as_user(cur, None)
    for t in ("ride_locations", "rides", "ride_events", "messages", "saved_locations", "navigation_sessions", "support_tickets", "group_members"):
        assert rows(cur, f"SELECT * FROM {t} LIMIT 1") in (None, []), t
    assert rows(cur, "SELECT email FROM profiles LIMIT 1") is None


def test_private_profile_fields_hidden(cur, world):
    as_user(cur, B)
    for col in ("email", "phone_number", "emergency_contact", "blood_group", "hashed_password", "last_ip_address"):
        assert rows(cur, f"SELECT {col} FROM profiles WHERE id = %s", A["sub"]) is None, col
    assert rows(cur, "SELECT full_name FROM profiles WHERE id = %s", A["sub"]) == [("T",)]


def test_other_rider_cannot_see_private_ride_or_sos(cur, world):
    as_user(cur, B)
    assert rows(cur, "SELECT * FROM rides WHERE id = %s", world["ride"]) == []
    assert rows(cur, "SELECT * FROM ride_events WHERE ride_id = %s", world["ride"]) == []
    assert rows(cur, "SELECT * FROM ride_members WHERE ride_id = %s", world["ride"]) == []


def test_modified_ids_cannot_write_as_someone_else(cur, world):
    as_user(cur, B)
    assert write(cur, "UPDATE rides SET name = 'pwned' WHERE id = %s", world["ride"]) in (0, None)
    assert write(cur, "DELETE FROM ride_locations WHERE ride_id = %s", world["ride"]) in (0, None)
    assert write(cur, "INSERT INTO ride_locations (ride_id, user_id, latitude, longitude) VALUES (%s, %s, 0, 0)", world["ride"], A["sub"]) is None
    assert write(cur, "INSERT INTO ride_members (ride_id, user_id, role, status) VALUES (%s, %s, 'rider', 'approved')", world["ride"], B["sub"]) is None
    assert write(cur, "INSERT INTO rides (ride_code, owner_id, name, visibility, status) VALUES ('TSTX', %s, 'x', 'public', 'scheduled')", A["uid"]) is None
    assert write(cur, "INSERT INTO messages (group_id, user_id, username, content) VALUES (%s, %s, 'A', 'spoof')", world["group"], A["sub"]) is None
    assert write(cur, "UPDATE profiles SET role = 'admin' WHERE id = %s", B["sub"]) is None


def test_private_group_and_messages(cur, world):
    as_user(cur, B)
    assert rows(cur, "SELECT id, name FROM groups WHERE id = %s", world["group"]) == []
    assert rows(cur, "SELECT * FROM messages WHERE group_id = %s", world["group"]) == []
    assert rows(cur, "SELECT passcode FROM groups LIMIT 1") is None
    assert rows(cur, "SELECT public.rc_group_passcode(%s)", world["group"]) == [(None,)]
    assert rows(cur, "SELECT public.rc_join_group(%s, 'wrong', 'B')", world["group"]) == [(False,)]
    assert rows(cur, "SELECT * FROM messages WHERE group_id = %s", world["group"]) == []
    assert rows(cur, "SELECT public.rc_join_group(%s, '4321', 'B')", world["group"]) == [(True,)]
    assert len(rows(cur, "SELECT * FROM messages WHERE group_id = %s", world["group"])) == 1


def test_member_access_and_removal(cur, world):
    as_user(cur, B)
    assert rows(cur, "SELECT public.rc_join_ride_by_code('tstprv', 'B', null)") == [(uuid.UUID(world["ride"]),)]
    assert len(rows(cur, "SELECT * FROM ride_locations WHERE ride_id = %s", world["ride"])) == 1
    assert write(cur, "DELETE FROM ride_members WHERE ride_id = %s AND user_id = %s", world["ride"], B["sub"]) == 1
    assert rows(cur, "SELECT * FROM ride_locations WHERE ride_id = %s", world["ride"]) == []


def test_personal_places_and_history_are_owner_only(cur, world):
    as_user(cur, B)
    assert rows(cur, "SELECT * FROM saved_locations WHERE user_id = %s", A["uid"]) == []
    assert rows(cur, "SELECT * FROM navigation_sessions WHERE user_id = %s", A["sub"]) == []
    assert rows(cur, "SELECT * FROM support_tickets WHERE id = %s", world["ticket"]) == []
    as_user(cur, A)
    assert len(rows(cur, "SELECT * FROM saved_locations WHERE user_id = %s", A["uid"])) == 1


def test_normal_user_is_not_admin(cur, world):
    as_user(cur, B)
    assert rows(cur, "SELECT * FROM error_logs LIMIT 1") == []
    assert rows(cur, "SELECT * FROM audit_logs LIMIT 1") == []
    assert write(cur, "UPDATE cms_content SET id = id") == 0
    as_user(cur, ADMIN)
    assert len(rows(cur, "SELECT * FROM rides WHERE id = %s", world["ride"])) == 1
