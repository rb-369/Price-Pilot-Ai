from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from services.pricing import optimize_price, suggest_promotion
from services.llm_insights import generate_insight

router = APIRouter()


class CompetitorPriceData(BaseModel):
    name: str
    price: float
    inStock: Optional[bool] = True
    timestamp: Optional[str] = None


class DemandSignalData(BaseModel):
    searchTrendScore: Optional[float] = 50
    weatherFactor: Optional[float] = 0
    eventFactor: Optional[float] = 0
    socialSentimentScore: Optional[float] = 0
    compositeDemandScore: Optional[float] = 0.5
    timestamp: Optional[str] = None


class ProductData(BaseModel):
    name: Optional[str] = "Product"
    sku: Optional[str] = ""
    baseCost: float
    currentPrice: float
    minMargin: Optional[float] = 0.1
    stockLevel: Optional[int] = 100
    reorderThreshold: Optional[int] = 20


class OptimizeRequest(BaseModel):
    product: ProductData
    competitorPrices: Optional[List[CompetitorPriceData]] = []
    demandSignals: Optional[List[DemandSignalData]] = []


@router.post("/optimize-price")
async def optimize(request: OptimizeRequest):
    product = request.product.model_dump()
    competitors = [cp.model_dump() for cp in request.competitorPrices]
    demand = [ds.model_dump() for ds in request.demandSignals]

    recommendation = optimize_price(product, competitors, demand)

    # Generate LLM insight
    insight = await generate_insight(product, recommendation, competitors, demand)
    recommendation["insight"] = insight

    return recommendation


@router.post("/suggest-promotion")
async def promotion(request: OptimizeRequest):
    product = request.product.model_dump()
    demand = [ds.model_dump() for ds in request.demandSignals]

    result = suggest_promotion(product, demand)
    return result
