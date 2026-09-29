"""Server-side email OTP issuance and verification.

The OTP is generated, hashed, and checked entirely on the backend. The
frontend never sees or trusts a code it did not receive by email, and the
backend is the sole authority on whether a code is correct.

State lives in Redis (already a project dependency) keyed per email, so it
naturally expires and needs no schema migration:
    otp:{email}          hash {code_hash, attempts}   TTL = OTP_TTL_S
    otp:cooldown:{email} "1"                          TTL = RESEND_COOLDOWN_S
"""
from __future__ import annotations

import hashlib
import logging
import secrets

import redis as sync_redis

from core.config import settings

logger = logging.getLogger(__name__)

OTP_TTL_S = 5 * 60          # code expires 5 minutes after issuance
RESEND_COOLDOWN_S = 30      # minimum gap between two sends to the same email
MAX_ATTEMPTS = 5            # wrong guesses allowed before the code is invalidated

_redis_client: sync_redis.Redis | None = None


def _client() -> sync_redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = sync_redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def _hash_code(email: str, code: str) -> str:
    return hashlib.sha256(f"{email.lower()}:{code}".encode()).hexdigest()


def is_in_cooldown(email: str) -> bool:
    return _client().exists(f"otp:cooldown:{email.lower()}") == 1


def issue_otp(email: str) -> str:
    """Generate a new 6-digit code, store its hash, and start the resend cooldown."""
    code = f"{secrets.randbelow(1_000_000):06d}"
    key = f"otp:{email.lower()}"
    r = _client()
    pipe = r.pipeline()
    pipe.hset(key, mapping={"code_hash": _hash_code(email, code), "attempts": 0})
    pipe.expire(key, OTP_TTL_S)
    pipe.set(f"otp:cooldown:{email.lower()}", "1", ex=RESEND_COOLDOWN_S)
    pipe.execute()
    return code


def verify_otp(email: str, code: str) -> bool:
    """Return True iff the code matches and the OTP has not been exhausted/expired.

    Single-use: the record is deleted on a correct guess. Wrong guesses count
    against MAX_ATTEMPTS; once exhausted the record is deleted and the user
    must request a new code.
    """
    key = f"otp:{email.lower()}"
    r = _client()
    record = r.hgetall(key)
    if not record:
        return False

    attempts = int(record.get("attempts", 0))
    if attempts >= MAX_ATTEMPTS:
        r.delete(key)
        return False

    if not secrets.compare_digest(record.get("code_hash", ""), _hash_code(email, code)):
        r.hincrby(key, "attempts", 1)
        return False

    r.delete(key)
    return True
