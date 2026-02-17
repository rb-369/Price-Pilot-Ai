from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict
from services.forecasting import forecast_demand

router = APIRouter()


class DemandPoint(BaseModel):
    score: float
    timestamp: Optional[str] = None


class ProductInfo(BaseModel):
    name: Optional[str] = "Unknown Product"
    stockLevel: Optional[int] = 100
    reorderThreshold: Optional[int] = 20


class ForecastRequest(BaseModel):
    product: ProductInfo
    demandHistory: List[DemandPoint]
    forecastDays: Optional[int] = 30


@router.post("/forecast")
async def get_forecast(request: ForecastRequest):
    demand_history = [{"score": dp.score, "timestamp": dp.timestamp} for dp in request.demandHistory]
    product_info = request.product.model_dump()

    result = forecast_demand(
        demand_history=demand_history,
        forecast_days=request.forecastDays,
        product_info=product_info,
    )
    return result
