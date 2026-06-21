"""
Google Trends Service
Fetches real search trend data for products via SerpAPI (preferred)
or pytrends (free fallback). Falls back to simulation if neither works.
"""
import os
import httpx
import asyncio
from typing import Optional
from datetime import datetime


SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")
SERPAPI_BASE = "https://serpapi.com/search.json"


async def get_google_trends_score(product_name: str, region: str = "IN") -> dict:
    """
    Get a search interest score (0-100) for a product.

    Strategy:
      1. SerpAPI Google Trends endpoint (most reliable)
      2. pytrends library (free, rate-limited)
      3. Simulated score based on product name hash (deterministic fallback)

    Returns:
        {"score": int, "source": str, "keyword": str}
    """
    # ── Strategy 1: SerpAPI ────────────────────────────────────────────────
    if SERPAPI_KEY:
        try:
            result = await _fetch_via_serpapi(product_name, region)
            if result is not None:
                return {"score": result, "source": "serpapi_google_trends", "keyword": product_name}
        except Exception as e:
            print(f"[GoogleTrends] SerpAPI failed: {e}")

    # ── Strategy 2: pytrends (free, rate-limited) ─────────────────────────
    try:
        result = await _fetch_via_pytrends(product_name, region)
        if result is not None:
            return {"score": result, "source": "pytrends", "keyword": product_name}
    except Exception as e:
        print(f"[GoogleTrends] pytrends failed: {e}")

    # ── Strategy 3: Deterministic simulation ──────────────────────────────
    score = _simulate_trend_score(product_name)
    return {"score": score, "source": "simulated", "keyword": product_name}


async def _fetch_via_serpapi(keyword: str, region: str) -> Optional[int]:
    """Fetch Google Trends interest via SerpAPI."""
    params = {
        "engine": "google_trends",
        "q": keyword,
        "geo": region,
        "data_type": "TIMESERIES",
        "date": "today 1-m",  # Last 30 days
        "api_key": SERPAPI_KEY,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(SERPAPI_BASE, params=params)
        response.raise_for_status()
        data = response.json()

    timeline = data.get("interest_over_time", {}).get("timeline_data", [])
    if not timeline:
        return None

    # Get the most recent 7 data points and average them
    recent = timeline[-7:] if len(timeline) >= 7 else timeline
    values = []
    for point in recent:
        for val in point.get("values", []):
            extracted = val.get("extracted_value", 0)
            if isinstance(extracted, (int, float)):
                values.append(extracted)

    if not values:
        return None

    avg_score = int(sum(values) / len(values))
    return max(0, min(100, avg_score))


async def _fetch_via_pytrends(keyword: str, region: str) -> Optional[int]:
    """Fetch Google Trends via pytrends (free, no API key needed)."""
    try:
        from pytrends.request import TrendReq
    except ImportError:
        return None

    def _blocking_fetch():
        pytrends = TrendReq(hl="en-US", tz=330, timeout=(10, 25))
        pytrends.build_payload([keyword], cat=0, timeframe="today 1-m", geo=region)
        df = pytrends.interest_over_time()
        if df.empty:
            return None
        # Average of last 7 data points
        recent = df[keyword].tail(7)
        return int(recent.mean())

    # Run in thread pool to avoid blocking the event loop
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _blocking_fetch)
    return result


def _simulate_trend_score(product_name: str) -> int:
    """Deterministic simulated trend score based on product name hash."""
    day_of_year = datetime.utcnow().timetuple().tm_yday
    name_hash = sum(ord(c) for c in product_name)
    seed = (name_hash * 31 + day_of_year * 997) % 10000
    # Generate score in 30-90 range (realistic for most products)
    score = 30 + (seed % 61)
    # Weekend boost
    if datetime.utcnow().weekday() >= 5:
        score = min(100, score + 8)
    return score
