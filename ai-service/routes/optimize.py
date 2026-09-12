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
    brand: Optional[str] = ""
    category: Optional[str] = "General"
    baseCost: float
    currentPrice: float
    minMargin: Optional[float] = 0.1
    stockLevel: Optional[int] = 100
    reorderThreshold: Optional[int] = 20


class OptimizeRequest(BaseModel):
    user_id: Optional[str] = "global"
    product: ProductData
    competitorPrices: Optional[List[CompetitorPriceData]] = []
    demandSignals: Optional[List[DemandSignalData]] = []


import os
from services.rainforest import search_competitors_by_keyword, is_same_brand
from services.validator import validate_competitors

@router.post("/optimize-price")
async def optimize(request: OptimizeRequest):
    product = request.product.model_dump()
    competitors = [cp.model_dump() for cp in request.competitorPrices]
    demand = [ds.model_dump() for ds in request.demandSignals]

    user_brand = (product.get("brand") or "").strip()

    # --- Filter out any self-brand items sent from older database records ---
    if user_brand and competitors:
        competitors = [
            c for c in competitors 
            if not is_same_brand(c.get("productName") or c.get("name", ""), c.get("brand", ""), user_brand)
        ]

    # --- Live Rival Competitor Data Injection ---
    if not competitors:
        print(f"Fetching Live Rival Competitors for '{product['name']}' (Brand: '{user_brand}')...")
        competitors = await search_competitors_by_keyword(
            keyword=product["name"],
            brand=product.get("brand"),
            category=product.get("category"),
            price=product.get("currentPrice"),
        )

        # AI Validation step: Filter out junk products and confirm no self-brand items
        if competitors:
            competitors = await validate_competitors(product["name"], competitors, user_brand=user_brand)
    # ----------------------------------------

    recommendation = optimize_price(product, competitors, demand, user_id=request.user_id)

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
