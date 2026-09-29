"""Outbound transactional email, sent server-side via the EmailJS REST API.

Sending happens from the backend (not the browser) so the OTP value is never
constructed or held anywhere the client can read it.
"""
from __future__ import annotations

import logging

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send"


class EmailSendError(Exception):
    pass


def send_otp_email(to_email: str, code: str) -> None:
    if not settings.EMAILJS_SERVICE_ID or not settings.EMAILJS_TEMPLATE_ID or not settings.EMAILJS_PUBLIC_KEY:
        if settings.DEBUG:
            # No EmailJS creds in local dev (DEBUG=true) — print the code
            # instead of failing the whole login flow. Must stay opt-in: a
            # misconfigured production deployment (DEBUG unset/false) should
            # still fail loudly rather than silently never emailing anyone.
            logger.warning("EmailJS not configured — OTP for %s is: %s", to_email, code)
            return
        raise EmailSendError("EmailJS is not configured on the server")

    payload = {
        "service_id": settings.EMAILJS_SERVICE_ID,
        "template_id": settings.EMAILJS_TEMPLATE_ID,
        "user_id": settings.EMAILJS_PUBLIC_KEY,
        "template_params": {
            "rideclubemail": f"Your Verification Code is: {code}",
            "reply_to": to_email,
            "to_email": to_email,
            "user_email": to_email,
            "email": to_email,
            "to": to_email,
            "recipient": to_email,
        },
    }
    if settings.EMAILJS_PRIVATE_KEY:
        payload["accessToken"] = settings.EMAILJS_PRIVATE_KEY

    try:
        resp = httpx.post(EMAILJS_API_URL, json=payload, timeout=10)
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        logger.error("EmailJS send failed: %s", exc)
        raise EmailSendError("Failed to send verification email") from exc
