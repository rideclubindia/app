import logging
import httpx
from fastapi import APIRouter, HTTPException, Response
from core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["traffic"])

TOMTOM_TILE_URL = "https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png"


@router.get("/tile/{z}/{x}/{y}")
async def get_traffic_tile(z: int, x: int, y: int):
    """Proxy TomTom traffic flow tiles server-side so the API key is never exposed to the client."""
    url = TOMTOM_TILE_URL.format(z=z, x=x, y=y)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params={"key": settings.TOMTOM_API_KEY})
        if resp.status_code != 200:
            logger.warning(f"TomTom tile request failed: status={resp.status_code} url={url}")
            raise HTTPException(status_code=resp.status_code, detail="Failed to fetch traffic tile")
        return Response(content=resp.content, media_type="image/png")
    except httpx.HTTPError as e:
        logger.exception(f"Error fetching TomTom traffic tile: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch traffic tile")
