"""
Scraper Route — Rainforest API Integration
Exposes endpoints for the Node.js backend to trigger competitor price fetches.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import os

from services.rainforest import (
    fetch_competitor_prices,
    search_competitors_by_keyword,
)

router = APIRouter()


class ScrapeByAsinRequest(BaseModel):
    asins: List[str]
    amazonDomain: Optional[str] = "amazon.in"


class ScrapeByKeywordRequest(BaseModel):
    keyword: str
    amazonDomain: Optional[str] = "amazon.in"
    maxResults: Optional[int] = 5
    # Fallback: if no API key, use mock prices based on this base price
    basePriceForMock: Optional[float] = None


@router.post("/scrape/asins")
async def scrape_by_asins(request: ScrapeByAsinRequest):
    """
    Fetch real-time competitor prices for a list of ASINs.
    Call this from your Node.js backend when you want fresh competitor data.

    Example body:
    {
        "asins": ["B09G9HD6PD", "B08L5TNJHG"],
        "amazonDomain": "amazon.in"
    }
    """
    if not request.asins:
        raise HTTPException(status_code=400, detail="At least one ASIN is required.")

    if len(request.asins) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 ASINs per request.")

    api_key = os.getenv("RAINFOREST_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="RAINFOREST_API_KEY not configured. Set it in your .env file.",
        )

    results = await fetch_competitor_prices(
        asins=request.asins,
        amazon_domain=request.amazonDomain,
    )

    return {
        "competitors": results,
        "fetched": len(results),
        "requested": len(request.asins),
        "failed": len(request.asins) - len(results),
        "source": "rainforest_api",
    }


@router.post("/scrape/search")
async def scrape_by_keyword(request: ScrapeByKeywordRequest):
    """
    Search Amazon for a keyword and return competitor prices.
    Use this when you don't have specific ASINs.

    If RAINFOREST_API_KEY is not set, returns mock data (for dev/testing).

    Example body:
    {
        "keyword": "wireless bluetooth earbuds under 1500",
        "amazonDomain": "amazon.in",
        "maxResults": 5
    }
    """
    if not request.keyword.strip():
        raise HTTPException(status_code=400, detail="Keyword cannot be empty.")

    api_key = os.getenv("RAINFOREST_API_KEY", "")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="RAINFOREST_API_KEY not configured. Set it in your .env file to fetch real competitor data.",
        )

    results = await search_competitors_by_keyword(
        keyword=request.keyword,
        amazon_domain=request.amazonDomain,
        max_results=request.maxResults,
    )

    return {
        "competitors": results,
        "fetched": len(results),
        "source": "rainforest_api",
    }


@router.get("/scrape/health")
async def scrape_health():
    """Check if Rainforest API key is configured."""
    api_key = os.getenv("RAINFOREST_API_KEY", "")
    return {
        "rainforestApiConfigured": bool(api_key),
        "amazonDomainDefault": "amazon.in",
        "status": "ready" if api_key else "missing_api_key",
    }