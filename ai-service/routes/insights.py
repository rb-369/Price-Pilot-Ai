from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
from services.llm_insights import generate_insight

router = APIRouter()


class InsightRequest(BaseModel):
    product: Dict[str, Any]
    recommendation: Dict[str, Any]
    competitorPrices: Optional[list] = []
    demandSignals: Optional[list] = []


@router.post("/generate-insight")
async def get_insight(request: InsightRequest):
    insight = await generate_insight(
        product=request.product,
        recommendation=request.recommendation,
        competitor_prices=request.competitorPrices,
        demand_signals=request.demandSignals,
    )
    return {"insight": insight}
