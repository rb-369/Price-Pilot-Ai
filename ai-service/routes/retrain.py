"""
Retrain Route
Endpoints for ML model retraining and status checking.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional

from services.elasticity_model import get_elasticity_model

router = APIRouter()


class TrainingObservation(BaseModel):
    features: Dict
    elasticity_observed: float


class RetrainRequest(BaseModel):
    training_data: List[TrainingObservation]


@router.post("/retrain-elasticity")
async def retrain_elasticity(request: RetrainRequest):
    """
    Retrain the elasticity ML model with historical feedback data.
    Called by the Node.js weekly cron job or manually triggered.
    """
    model = get_elasticity_model()
    data = [obs.model_dump() for obs in request.training_data]
    result = model.train(data)
    return result


@router.get("/model-status")
async def model_status():
    """Check current ML model status, version, and accuracy metrics."""
    model = get_elasticity_model()
    return model.get_status()


class PredictRequest(BaseModel):
    demand_score: Optional[float] = 0.5
    competitor_spread: Optional[float] = 0.1
    stock_ratio: Optional[float] = 3.0
    price_level: Optional[float] = 1000
    margin_pct: Optional[float] = 0.2
    search_trend_normalized: Optional[float] = 0.5


@router.post("/predict-elasticity")
async def predict_elasticity(request: PredictRequest):
    """Test elasticity prediction for given features."""
    model = get_elasticity_model()
    features = request.model_dump()
    elasticity, source = model.predict(features)
    return {
        "elasticity": round(elasticity, 3),
        "source": source,
        "features_used": features,
    }
