"""
Data Pipeline Orchestrator
Collects demand signals from all real data sources in parallel.
Provides a single unified API for the Node.js backend to call.
"""
import asyncio
from typing import Dict, Optional
from datetime import datetime

from services.google_trends import get_google_trends_score
from services.weather import get_weather_factor
from services.news_sentiment import get_news_sentiment


# Indian festive season calendar (static event detection)
INDIAN_EVENTS = {
    # (month, day_start, day_end, boost_factor, event_name)
    (1, 14, 15): (0.3, "Makar Sankranti"),
    (1, 26, 26): (0.25, "Republic Day Sales"),
    (3, 8, 8): (0.2, "International Women's Day"),
    (8, 15, 15): (0.3, "Independence Day Sales"),
    (10, 1, 31): (0.6, "Festive Season (Navratri/Dussehra)"),
    (11, 1, 15): (0.8, "Diwali Sales"),
    (11, 16, 30): (0.4, "Post-Diwali Clearance"),
    (11, 24, 28): (0.5, "Black Friday / Cyber Monday"),
    (12, 20, 31): (0.35, "Year-End Sales"),
}


def detect_event_factor() -> Dict:
    """
    Detect if today falls within a known sales/festive event period.

    Returns:
        {"factor": float, "event": str | None, "source": "calendar"}
    """
    now = datetime.utcnow()
    month = now.month
    day = now.day

    for (m, d_start, d_end), (boost, event_name) in INDIAN_EVENTS.items():
        if month == m and d_start <= day <= d_end:
            return {
                "factor": round(boost, 3),
                "event": event_name,
                "source": "calendar",
            }

    return {
        "factor": 0.0,
        "event": None,
        "source": "calendar",
    }


async def collect_real_demand_signal(
    product_name: str,
    category: str = "general",
    city: str = "Mumbai",
) -> Dict:
    """
    Orchestrate all data sources in parallel and return a unified demand signal.

    This replaces the simulated `generateDemandSignals()` function in
    the Node.js demandService.js.

    Args:
        product_name: Name of the product
        category: Product category (for weather impact calculation)
        city: City for weather data

    Returns:
        Unified demand signal compatible with existing DemandSignal schema
    """
    # Run all data sources concurrently
    trends_task = get_google_trends_score(product_name)
    weather_task = get_weather_factor(city, category)
    sentiment_task = get_news_sentiment(product_name, category)

    trends_result, weather_result, sentiment_result = await asyncio.gather(
        trends_task, weather_task, sentiment_task,
        return_exceptions=True,
    )

    # Handle exceptions gracefully
    if isinstance(trends_result, Exception):
        print(f"[Pipeline] Trends failed: {trends_result}")
        trends_result = {"score": 50, "source": "error_fallback"}

    if isinstance(weather_result, Exception):
        print(f"[Pipeline] Weather failed: {weather_result}")
        weather_result = {"factor": 0.0, "source": "error_fallback"}

    if isinstance(sentiment_result, Exception):
        print(f"[Pipeline] Sentiment failed: {sentiment_result}")
        sentiment_result = {"score": 0.0, "source": "error_fallback"}

    # Event detection (synchronous, no API call)
    event_data = detect_event_factor()

    # Build sources metadata
    sources = {
        "trends": trends_result.get("source", "unknown"),
        "weather": weather_result.get("source", "unknown"),
        "sentiment": sentiment_result.get("source", "unknown"),
        "event": event_data.get("source", "calendar"),
    }

    # Determine overall data quality
    real_sources = sum(1 for s in sources.values() if s not in ("simulated", "heuristic", "error_fallback", "calendar"))
    data_quality = "real" if real_sources >= 2 else "mixed" if real_sources >= 1 else "simulated"

    return {
        # Fields matching the existing DemandSignal schema
        "searchTrendScore": trends_result.get("score", 50),
        "weatherFactor": weather_result.get("factor", 0.0),
        "socialSentimentScore": sentiment_result.get("score", 0.0),
        "eventFactor": event_data.get("factor", 0.0),

        # Metadata for logging/debugging
        "metadata": {
            "sources": sources,
            "dataQuality": data_quality,
            "eventName": event_data.get("event"),
            "weatherCondition": weather_result.get("weather"),
            "weatherTemp": weather_result.get("temp"),
            "sentimentAnalysis": sentiment_result.get("analysis", ""),
            "sentimentTrend": sentiment_result.get("trend", "neutral"),
            "trendsKeyword": trends_result.get("keyword", product_name),
            "city": city,
            "timestamp": datetime.utcnow().isoformat(),
        },
    }


async def collect_bulk_signals(
    products: list,
    city: str = "Mumbai",
    max_concurrent: int = 5,
) -> list:
    """
    Collect demand signals for multiple products concurrently.

    Args:
        products: List of {"name": str, "category": str}
        city: City for weather data
        max_concurrent: Max parallel collections

    Returns:
        List of demand signals (one per product)
    """
    semaphore = asyncio.Semaphore(max_concurrent)

    async def _collect_one(product: dict):
        async with semaphore:
            return await collect_real_demand_signal(
                product_name=product.get("name", "Product"),
                category=product.get("category", "general"),
                city=city,
            )

    results = await asyncio.gather(
        *[_collect_one(p) for p in products],
        return_exceptions=True,
    )

    # Replace exceptions with empty signals
    return [
        r if not isinstance(r, Exception) else {
            "searchTrendScore": 50,
            "weatherFactor": 0.0,
            "socialSentimentScore": 0.0,
            "eventFactor": 0.0,
            "metadata": {"sources": {}, "dataQuality": "error"},
        }
        for r in results
    ]
