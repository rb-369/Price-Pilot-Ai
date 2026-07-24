from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from services.pricing import optimize_price, suggest_promotion
from services.llm_insights import generate_insight

router = APIRouter()


class CompetitorPriceData(BaseModel):
    name: str
    price: float
    productName: Optional[str] = ""
    url: Optional[str] = ""
    rating: Optional[float] = None
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


import os
from services.rainforest import search_competitors_by_keyword
from services.validator import validate_competitors

@router.post("/optimize-price")
async def optimize(request: OptimizeRequest):
    product = request.product.model_dump()
    competitors = [cp.model_dump() for cp in request.competitorPrices]
    demand = [ds.model_dump() for ds in request.demandSignals]

    # --- Live Competitor Data Injection ---
    # If Node server sends empty competitors, or we want to guarantee live data:
    if not competitors:
        api_key = os.getenv("RAINFOREST_API_KEY", "")
        if api_key:
            print(f"Fetching Live Amazon Competitors for '{product['name']}'...")
            competitors = await search_competitors_by_keyword(product["name"])

            # AI Validation step: Filter out junk products
            if competitors:
                competitors = await validate_competitors(product["name"], competitors)

        if not competitors:
            return {
                "error": True,
                "message": "Failed to fetch competitor prices. Please configure RAINFOREST_API_KEY or add competitors manually."
            }
    # ----------------------------------------

    recommendation = optimize_price(product, competitors, demand)

    # Generate LLM insight
    insight = await generate_insight(product, recommendation, competitors, demand)
    recommendation["insight"] = insight
    
    # Return competitors array as well so the frontend can see the live Amazon prices!
    recommendation["competitorsUsed"] = competitors

    return recommendation


@router.post("/suggest-promotion")
async def promotion(request: OptimizeRequest):
    product = request.product.model_dump()
    demand = [ds.model_dump() for ds in request.demandSignals]

    result = suggest_promotion(product, demand)
    return result
