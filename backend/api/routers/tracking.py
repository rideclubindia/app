from fastapi import APIRouter, Depends, HTTPException
from schemas.schemas import LocationUpdateSchema
from workers.tasks import process_location_update
from api.deps import get_current_user
from models.models import User

router = APIRouter()

@router.post("/update")
def location_update(
    location: LocationUpdateSchema,
    current_user: User = Depends(get_current_user)
):
    """
    Ingest GPS tracking point.
    Delegates processing to Celery for high throughput.
    """
    if location.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to post for this user")
    
    # Enqueue task
    process_location_update.apply_async(
        kwargs={"location_data": location.model_dump()},
        queue="tracking"
    )
    
    return {"status": "success", "message": "Location update queued"}
