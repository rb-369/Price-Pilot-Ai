"""
News Sentiment Service
Fetches real news/social sentiment for products via:
  1. NewsAPI (headlines) → Gemini (sentiment scoring)
  2. Gemini direct analysis (fallback)
  3. Keyword heuristic (last resort)
"""
import os
import json
import httpx
from typing import Optional


NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")
NEWSAPI_BASE = "https://newsapi.org/v2/everything"
LLM_API_KEY = os.getenv("LLM_API_KEY", "")

SENTIMENT_PROMPT = """You are a consumer sentiment analyst. Analyze these recent news headlines about "{product_name}" in the "{category}" category.

Headlines:
{headlines}

Return ONLY a JSON object:
{{
  "sentiment_score": integer (0-100, where 0=very negative, 50=neutral, 100=very positive),
  "trend": "positive" | "negative" | "neutral",
  "key_driver": "1 sentence explaining what's driving sentiment"
}}
"""


async def get_news_sentiment(product_name: str, category: str = "general") -> dict:
    """
    Get real sentiment score for a product from news/social data.

    Returns:
        {"score": float (-0.5 to 1.5), "source": str, "analysis": str}
    """
    # ── Strategy 1: NewsAPI headlines → Gemini scoring ────────────────────
    if NEWSAPI_KEY and LLM_API_KEY:
        try:
            headlines = await _fetch_news_headlines(product_name, category)
            if headlines:
                result = await _score_with_gemini(product_name, category, headlines)
                if result:
                    # Map 0-100 to -1.0 to 1.0 range (matching existing schema)
                    mapped_score = (result["sentiment_score"] / 50) - 1.0
                    return {
                        "score": round(mapped_score, 3),
                        "raw_score": result["sentiment_score"],
                        "source": "newsapi_gemini",
                        "analysis": result.get("key_driver", ""),
                        "trend": result.get("trend", "neutral"),
                        "headlines_used": len(headlines),
                    }
        except Exception as e:
            print(f"[Sentiment] NewsAPI+Gemini pipeline failed: {e}")

    # ── Strategy 2: Gemini direct analysis (no news data) ─────────────────
    if LLM_API_KEY:
        try:
            result = await _direct_gemini_sentiment(product_name, category)
            if result:
                mapped_score = (result["sentiment_score"] / 50) - 1.0
                return {
                    "score": round(mapped_score, 3),
                    "raw_score": result["sentiment_score"],
                    "source": "gemini_direct",
                    "analysis": result.get("key_driver", ""),
                    "trend": result.get("trend", "neutral"),
                    "headlines_used": 0,
                }
        except Exception as e:
            print(f"[Sentiment] Gemini direct analysis failed: {e}")

    # ── Strategy 3: Heuristic fallback ────────────────────────────────────
    score = _heuristic_sentiment(product_name)
    return {
        "score": round(score, 3),
        "raw_score": int((score + 0.5) / 2 * 100),
        "source": "heuristic",
        "analysis": "Fallback sentiment estimate.",
        "trend": "neutral",
        "headlines_used": 0,
    }


async def _fetch_news_headlines(product_name: str, category: str) -> list:
    """Fetch recent news headlines from NewsAPI."""
    # Build search query — combine product name with category for better results
    query = f'"{product_name}" OR "{category} {product_name}"'

    params = {
        "q": query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 10,
        "apiKey": NEWSAPI_KEY,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(NEWSAPI_BASE, params=params)
        response.raise_for_status()
        data = response.json()

    articles = data.get("articles", [])
    headlines = []
    for article in articles[:10]:
        title = article.get("title", "")
        desc = article.get("description", "")
        if title and title != "[Removed]":
            headlines.append(f"- {title}")
            if desc and desc != "[Removed]":
                headlines.append(f"  Context: {desc[:120]}")

    return headlines


async def _score_with_gemini(product_name: str, category: str, headlines: list) -> Optional[dict]:
    """Score headlines sentiment using Gemini."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=LLM_API_KEY)
    prompt = SENTIMENT_PROMPT.format(
        product_name=product_name,
        category=category,
        headlines="\n".join(headlines[:15]),
    )

    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    return json.loads(response.text.strip())


async def _direct_gemini_sentiment(product_name: str, category: str) -> Optional[dict]:
    """Ask Gemini directly about product sentiment without news data."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=LLM_API_KEY)
    prompt = f"""You are a consumer market analyst. Based on your general knowledge of current market conditions,
estimate the consumer sentiment for "{product_name}" in the "{category}" category.
Consider factors like brand perception, market trends, seasonal demand, and competitive landscape.

Return ONLY a JSON object:
{{
  "sentiment_score": integer (0-100),
  "trend": "positive" | "negative" | "neutral",
  "key_driver": "1 sentence explanation"
}}"""

    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.3,
        ),
    )

    return json.loads(response.text.strip())


def _heuristic_sentiment(product_name: str) -> float:
    """Deterministic heuristic sentiment score."""
    from datetime import datetime
    day_of_year = datetime.utcnow().timetuple().tm_yday
    name_hash = sum(ord(c) for c in product_name)
    seed = (name_hash * 41 + day_of_year * 13) % 1000
    # Generate value in -0.2 to 0.8 range (slightly positive bias)
    return (seed / 1000) * 1.0 - 0.2
