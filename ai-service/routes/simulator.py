from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from services.simulator import run_predictive_simulation

router = APIRouter()


class CompetitorData(BaseModel):
    name: Optional[str] = ""
    price: float
    productName: Optional[str] = ""
    inStock: Optional[bool] = True


class DemandSignalData(BaseModel):
    compositeDemandScore: Optional[float] = 0.5
    searchTrendScore: Optional[float] = 50.0


class ProductData(BaseModel):
    name: Optional[str] = "Product"
    sku: Optional[str] = ""
    baseCost: float
    currentPrice: float
    stockLevel: Optional[int] = 100
    reorderThreshold: Optional[int] = 10
    salesVelocity: Optional[Dict[str, Any]] = None


class SimulationRequest(BaseModel):
    user_id: Optional[str] = "global"
    product: ProductData
    competitorPrices: Optional[List[CompetitorData]] = []
    demandSignals: Optional[List[DemandSignalData]] = []
    targetPrice: float
    cogs: Optional[float] = None
    competitorStrategy: Optional[str] = "neutral"
    demandMultiplier: Optional[float] = 1.0
    timeHorizonDays: Optional[int] = 30


@router.post("/simulate")
async def simulate(request: SimulationRequest):
    product_dict = request.product.model_dump()
    competitors = [c.model_dump() for c in request.competitorPrices] if request.competitorPrices else []
    demand = [d.model_dump() for d in request.demandSignals] if request.demandSignals else []

    result = run_predictive_simulation(
        product=product_dict,
        competitors=competitors,
        demand_signals=demand,
        target_price=request.targetPrice,
        cogs=request.cogs,
        competitor_strategy=request.competitorStrategy or "neutral",
        demand_multiplier=request.demandMultiplier or 1.0,
        time_horizon_days=request.timeHorizonDays or 30,
        user_id=request.user_id or "global"
    )
    return result
