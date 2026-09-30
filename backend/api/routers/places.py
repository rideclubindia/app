import logging
import re
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request

from api.deps import get_current_user
from core.config import settings
from core.limiter import limiter
from models.models import User

# Google Places (New) proxy: the API key stays on the server and only signed-in riders can search
router = APIRouter(tags=["places"])
logger = logging.getLogger(__name__)

PLACES = "https://places.googleapis.com/v1"
PLACE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{10,300}$")
SESSION_RE = re.compile(r"^[A-Za-z0-9-]{8,64}$")


def _key() -> str:
    if not settings.GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=503, detail="Place search is not configured")
    return settings.GOOGLE_MAPS_API_KEY


@router.get("/places/autocomplete")
@limiter.limit("120/minute")
async def autocomplete(
    request: Request, q: str, lat: Optional[float] = None, lng: Optional[float] = None,
    session: Optional[str] = None, user: User = Depends(get_current_user),
):
    q = q.strip()[:120]
    if len(q) < 2:
        return {"places": []}
    body: dict = {"input": q, "includedRegionCodes": ["in"], "languageCode": "en"}
    if lat is not None and lng is not None and -90 <= lat <= 90 and -180 <= lng <= 180:
        centre = {"latitude": lat, "longitude": lng}
        body["locationBias"] = {"circle": {"center": centre, "radius": 50000.0}}
        body["origin"] = centre
    if session and SESSION_RE.match(session):
        body["sessionToken"] = session
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.post(f"{PLACES}/places:autocomplete", json=body, headers={"X-Goog-Api-Key": _key()})
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Place search is unavailable")
    if r.status_code != 200:
        logger.warning("Places autocomplete failed: %s", r.status_code)
        raise HTTPException(status_code=502, detail="Place search is unavailable")
    out = []
    for s in r.json().get("suggestions", []):
        p = s.get("placePrediction")
        if not p:
            continue
        fmt = p.get("structuredFormat") or {}
        out.append({
            "id": p.get("placeId"),
            "name": (fmt.get("mainText") or {}).get("text") or (p.get("text") or {}).get("text", ""),
            "address": (fmt.get("secondaryText") or {}).get("text", ""),
            "distanceM": p.get("distanceMeters"),
        })
    return {"places": out}


@router.get("/places/{place_id}")
@limiter.limit("120/minute")
async def place_details(request: Request, place_id: str, session: Optional[str] = None, user: User = Depends(get_current_user)):
    if not PLACE_ID_RE.match(place_id):
        raise HTTPException(status_code=400, detail="Invalid place")
    params = {"languageCode": "en"}
    if session and SESSION_RE.match(session):
        params["sessionToken"] = session
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(
                f"{PLACES}/places/{place_id}", params=params,
                headers={"X-Goog-Api-Key": _key(), "X-Goog-FieldMask": "id,displayName,formattedAddress,location"},
            )
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Place details are unavailable")
    if r.status_code != 200:
        logger.warning("Places details failed: %s", r.status_code)
        raise HTTPException(status_code=502, detail="Place details are unavailable")
    d = r.json()
    loc = d.get("location") or {}
    if "latitude" not in loc:
        raise HTTPException(status_code=404, detail="Place has no location")
    return {
        "id": d.get("id"),
        "name": (d.get("displayName") or {}).get("text", ""),
        "address": d.get("formattedAddress", ""),
        "lat": loc["latitude"],
        "lng": loc["longitude"],
    }
