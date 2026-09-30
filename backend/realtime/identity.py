"""Identity resolution for the real-time gateway.

Authentication model (mirrors api/deps.py):
  * Clients connect with the backend JWT issued by /api/v1/auth/firebase-login
    (HS256, claims: sub=email, uid=firebase uid, role).
  * The token is verified with the shared JWT_SECRET. The user id used by ride
    rooms is the Firebase UID mapped to the deterministic UUID that the rest of
    the application writes into ride_members / ride_locations.

Security rules:
  * The client NEVER supplies its own user id - identity comes exclusively
    from the signed token.
  * Expired signatures are reported distinctly so clients can refresh.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

from core.ids import member_uuid

import jwt as pyjwt

from core.config import settings

logger = logging.getLogger(__name__)


class AuthError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class Identity:
    user_id: int          # backend users.id (int PK)
    email: str
    firebase_uid: str
    member_id: str        # id used in ride_members / ride_locations rows
    role: str


def deterministic_uuid(string: str) -> str:
    return member_uuid(string)


def member_id_for_uid(firebase_uid: str) -> str:
    """Ride-member identity: 36-char ids pass through, short ids are hashed.

    The application writes either the raw Firebase UID or its deterministic
    UUID into ride_members.user_id. Membership checks accept both.
    """
    if len(firebase_uid) == 36:
        return firebase_uid
    return deterministic_uuid(firebase_uid)


def verify_token(token: str) -> Identity:
    """Verify a backend JWT and resolve the full identity.

    Raises AuthError(ERR_AUTH_EXPIRED) for expired tokens and
    AuthError(ERR_AUTH) for anything else invalid.
    """
    if not token:
        raise AuthError("AUTH_FAILED", "Missing token")
    try:
        payload = pyjwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
    except pyjwt.ExpiredSignatureError:
        raise AuthError("TOKEN_EXPIRED", "Token expired")
    except pyjwt.PyJWTError as exc:
        logger.debug("Socket token verification failed: %s", exc)
        raise AuthError("AUTH_FAILED", "Invalid token")

    email = payload.get("sub")
    if not email:
        raise AuthError("AUTH_FAILED", "Token missing subject")

    uid = payload.get("uid") or ""
    role = payload.get("role", "rider")

    # Tokens issued before the `uid` claim was added: fall back to the email
    # hash so the connection still works (member rooms keyed by email-derived
    # id) but ride membership checks will simply not match legacy rows.
    if not uid:
        uid = f"email:{email}"

    return Identity(
        user_id=0,  # backend int PK is not needed by the realtime layer
        email=email,
        firebase_uid=uid,
        member_id=member_id_for_uid(uid) if not uid.startswith("email:") else f"email:{email}",
        role=role,
    )
