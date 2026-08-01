from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task(name="workers.tasks.process_location_update")
def process_location_update(location_data: dict):
    """
    Background task to process a new location update.
    This inserts into the DB and triggers stop/distance logic.
    """
    logger.info(f"Processing location update for User {location_data.get('user_id')} in Ride {location_data.get('ride_id')}")
    
    # In a real scenario, this would use a dedicated DB session to insert the point 
    # using ST_SetSRID(ST_MakePoint(lon, lat), 4326)
    
    # Then it would trigger stop detection analytics.
    # calculate_stop_detection.delay(location_data['user_id'], location_data['ride_id'])
    return True

@shared_task(name="workers.tasks.calculate_analytics")
def calculate_analytics(ride_id: int):
    """
    Background task to crunch numbers for a ride (duration, distance, speeds).
    """
    logger.info(f"Calculating analytics for Ride {ride_id}")
    return True
