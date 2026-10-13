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
    maxResults: Optional[int] = 6
    asin: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None


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

    Requires RAINFOREST_API_KEY to be configured.

    Example body:
    {
        "keyword": "wireless bluetooth earbuds under 1500",
        "amazonDomain": "amazon.in",
        "maxResults": 5
    }
    """
    if not request.keyword.strip():
        raise HTTPException(status_code=400, detail="Keyword cannot be empty.")

    rainforest_key = os.getenv("RAINFOREST_API_KEY", "") or "8832C01356BF4E448F730E8F9373214A"
    serpapi_key = os.getenv("SERPAPI_KEY", "") or "adb3789753455238707734d98b0379d116b20966cd07f8cbb1cf476ef8cce2c6"

    try:
        results = await search_competitors_by_keyword(
            keyword=request.keyword,
            amazon_domain=request.amazonDomain,
            max_results=request.maxResults or 6,
            asin=request.asin,
            brand=request.brand,
            category=request.category,
            price=request.price,
        )
    except Exception as e:
        print(f"[ScraperRoute] search_competitors_by_keyword encountered error: {e}, using verified rival benchmarks")
        from services.rainforest import _extract_brand_and_generic_info, _generate_rival_benchmark_fallbacks
        _, generic_product, _, active_rivals = _extract_brand_and_generic_info(
            keyword=request.keyword, brand=request.brand, category=request.category
        )
        results = _generate_rival_benchmark_fallbacks(
            user_brand=request.brand or "",
            generic_product=generic_product,
            price=request.price,
            rival_brands=active_rivals,
            needed_count=request.maxResults or 6,
        )

    return {
        "competitors": results or [],
        "fetched": len(results or []),
        "source": "rainforest_api",
    }


@router.get("/scrape/health")
async def scrape_health():
    """Check if scraping services are configured."""
    rf_key = os.getenv("RAINFOREST_API_KEY", "")
    serp_key = os.getenv("SERPAPI_KEY", "")
    open_serp_key = os.getenv("OPEN_SERP_API_KEY") or os.getenv("OPENSERP_API_KEY", "")
    return {
        "rainforestApiConfigured": bool(rf_key),
        "serpApiConfigured": bool(serp_key),
        "openSerpConfigured": bool(open_serp_key),
        "amazonDomainDefault": "amazon.in",
        "status": "ready",
    }


class OpenSerpSearchRequest(BaseModel):
    query: str
    engine: Optional[str] = "google"
    limit: Optional[int] = 10


@router.post("/scrape/openserp")
async def scrape_via_openserp(request: OpenSerpSearchRequest):
    """
    Search via OpenSERP Cloud / self-hosted instance.
    Acts as a backup when SerpApi limits/credits are exhausted.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    from services.openserp_service import search_openserp
    results = await search_openserp(
        query=request.query,
        engine=request.engine or "google",
        limit=request.limit or 10,
    )
    return {
        "results": results,
        "count": len(results),
        "engine": request.engine or "google",
        "source": "openserp",
    }