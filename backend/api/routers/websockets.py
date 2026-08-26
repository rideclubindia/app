"""Deprecated Socket.IO stub - kept as a compatibility shim.

The real-time platform now lives in backend/realtime/ (gateway.py et al).
This module re-exports the production gateway so existing imports
(`main.py` mounting, `pins.py` broadcasting) keep working unchanged.
"""
from realtime.gateway import (  # noqa: F401
    broadcast_new_pin,
    broadcast_ride_event,
    gateway,
    sio,
)
