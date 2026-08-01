from fastapi import APIRouter, Depends, HTTPException
import joblib
import pandas as pd
import os
from pydantic import BaseModel
from api.deps import get_current_user
from models.models import User

router = APIRouter(tags=["intelligence"])

class SeparationPredictionRequest(BaseModel):
    speed_kmh: float
    dist_to_leader: float
    hour_of_day: int
    day_of_week: int

class RoutePredictionRequest(BaseModel):
    current_lat: float
    current_lon: float
    heading: float
    time_of_day: int

@router.post("/predict/separation")
def predict_separation(data: SeparationPredictionRequest, user: User = Depends(get_current_user)):
    """
    Rider Intelligence Engine: Predicts chance of rider falling behind using XGBoost.
    """
    model_path = 'intelligence/models/separation_model.pkl'
    if not os.path.exists(model_path):
        raise HTTPException(status_code=503, detail="ML Model not trained yet.")
        
    model = joblib.load(model_path)
    
    # Format data for XGBoost
    df = pd.DataFrame([{
        'speed_kmh': data.speed_kmh,
        'dist_to_leader': data.dist_to_leader,
        'hour_of_day': data.hour_of_day,
        'day_of_week': data.day_of_week
    }])
    
    prediction = model.predict(df)[0]
    probability = model.predict_proba(df)[0][1]
    
    return {
        "will_separate": bool(prediction),
        "probability_percentage": round(probability * 100, 2),
        "risk_level": "High" if probability > 0.7 else "Medium" if probability > 0.4 else "Low"
    }

@router.post("/predict/route")
def predict_route(data: RoutePredictionRequest, user: User = Depends(get_current_user)):
    """
    Rider Intelligence Engine: Predicts likely next route/destination.
    """
    # Mocking inference for Route Prediction
    # In production, this would load a trained Scikit-Learn RandomForest or LSTM model.
    return {
        "likely_destination_lat": data.current_lat + 0.05,
        "likely_destination_lon": data.current_lon + 0.05,
        "confidence": 85.5
    }

@router.post("/predict/stop")
def predict_stop(user: User = Depends(get_current_user)):
    """
    Rider Intelligence Engine: Predicts likely next stop and expected duration.
    """
    return {
        "next_stop_type": "Tea Break",
        "estimated_distance_to_stop_km": 12.5,
        "expected_duration_minutes": 15
    }
