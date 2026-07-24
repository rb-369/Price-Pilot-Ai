"""
Rainforest API Service
Fetches real-time competitor pricing data from Amazon via Rainforest API.
Docs: https://www.rainforestapi.com/docs
"""
import os
import httpx
import asyncio
from typing import List, Dict, Optional
from datetime import datetime


RAINFOREST_API_KEY = os.getenv("RAINFOREST_API_KEY", "")
RAINFOREST_BASE_URL = "https://api.rainforestapi.com/request"

# Request timeout in seconds
REQUEST_TIMEOUT = 20


async def fetch_product_by_asin(asin: str, amazon_domain: str = "amazon.in") -> Optional[Dict]:
    """
    Fetch a single product's price and availability by ASIN.
    Returns a CompetitorPriceData-compatible dict or None on failure.
    """
    if not RAINFOREST_API_KEY:
        raise ValueError("RAINFOREST_API_KEY is not set in environment variables.")

    params = {
        "api_key": RAINFOREST_API_KEY,
        "type": "product",
        "asin": asin,
        "amazon_domain": amazon_domain,
        "include_summarization_attributes": "false",
        "include_a_plus_body": "false",
    }

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.get(RAINFOREST_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

        product = data.get("product", {})
        if not product:
            return None

        # Extract buybox / listing price
        buybox = product.get("buybox_winner", {})
        price_info = buybox.get("price", {}) or product.get("price", {})
        price_value = price_info.get("value")

        if price_value is None:
            return None

        in_stock = buybox.get("availability", {}).get("type", "in_stock") == "in_stock"

        return {
            "platform": "Amazon",
            "productName": product.get("title", f"ASIN:{asin}")[:150],
            "url": product.get("link", f"https://www.amazon.in/dp/{asin}"),
            "asin": asin,
            "price": float(price_value),
            "inStock": in_stock,
            "rating": product.get("rating"),
            "ratingsTotal": product.get("ratings_total"),
            "timestamp": datetime.utcnow().isoformat(),
            "source": "rainforest_api",
        }

    except httpx.HTTPStatusError as e:
        print(f"[Rainforest] HTTP error for ASIN {asin}: {e.response.status_code}")
        return None
    except httpx.RequestError as e:
        print(f"[Rainforest] Request error for ASIN {asin}: {e}")
        return None
    except Exception as e:
        print(f"[Rainforest] Unexpected error for ASIN {asin}: {e}")
        return None


async def fetch_competitor_prices(
    asins: List[str],
    amazon_domain: str = "amazon.in",
    max_concurrent: int = 3,
) -> List[Dict]:
    """
    Fetch prices for multiple ASINs concurrently.
    Respects rate limits via semaphore.

    Args:
        asins: List of Amazon ASINs to fetch
        amazon_domain: Amazon marketplace (amazon.in, amazon.com, etc.)
        max_concurrent: Max parallel requests (keep low to avoid rate limits)

    Returns:
        List of competitor price dicts, skipping failed fetches
    """
    semaphore = asyncio.Semaphore(max_concurrent)

    async def fetch_with_limit(asin: str) -> Optional[Dict]:
        async with semaphore:
            return await fetch_product_by_asin(asin, amazon_domain)

    results = await asyncio.gather(*[fetch_with_limit(asin) for asin in asins])

    # Filter out None (failed fetches)
    return [r for r in results if r is not None]


async def search_competitors_by_keyword(
    keyword: str,
    amazon_domain: str = "amazon.in",
    max_results: int = 5,
) -> List[Dict]:
    """
    Search Amazon for a keyword and return top results as competitor prices.
    Useful when you don't have specific competitor ASINs.

    Args:
        keyword: Product search query (e.g. "wireless earbuds under 1000")
        amazon_domain: Amazon marketplace
        max_results: How many results to return (max 10 recommended)

    Returns:
        List of competitor price dicts from search results
    """
    if not RAINFOREST_API_KEY:
        raise ValueError("RAINFOREST_API_KEY is not set in environment variables.")

    try:
        from services.flipkart_scraper import scrape_flipkart_prices
        
        # Try to get both Amazon and Flipkart results concurrently if possible
        import asyncio
        amazon_task = asyncio.create_task(_fetch_amazon_search(keyword, amazon_domain, max_results))
        flipkart_task = asyncio.create_task(scrape_flipkart_prices(keyword, max_results=2))
        
        amazon_results, flipkart_results = await asyncio.gather(amazon_task, flipkart_task, return_exceptions=True)
        
        competitors = []
        if not isinstance(amazon_results, Exception):
            competitors.extend(amazon_results)
        else:
            print(f"[Rainforest] Amazon fetch failed: {amazon_results}")
            
        if not isinstance(flipkart_results, Exception):
            competitors.extend(flipkart_results)
        else:
            print(f"[Rainforest] Flipkart fetch failed: {flipkart_results}")

        return competitors

    except Exception as e:
        print(f"[Rainforest] Search error for '{keyword}': {e}")
        return []

async def _fetch_amazon_search(keyword: str, amazon_domain: str, max_results: int) -> List[Dict]:
    """Helper to fetch from Rainforest API"""
    params = {
        "api_key": RAINFOREST_API_KEY,
        "type": "search",
        "search_term": keyword,
        "amazon_domain": amazon_domain,
        "sort_by": "featured",
        "exclude_sponsored": "true",
    }
    
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.get(RAINFOREST_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

        search_results = data.get("search_results", [])[:max_results]

        competitors = []
        for item in search_results:
            price_info = item.get("price", {})
            price_value = price_info.get("value") if price_info else None

            if price_value is None:
                continue

            competitors.append({
                "platform": "Amazon",
                "productName": item.get("title", "Unknown")[:150],
                "url": item.get("link", f"https://www.amazon.in/dp/{item.get('asin', '')}"),
                "asin": item.get("asin", ""),
                "price": float(price_value),
                "inStock": True,
                "rating": item.get("rating"),
                "ratingsTotal": item.get("ratings_total"),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "rainforest_search",
            })

        return competitors

    except httpx.HTTPStatusError as e:
        print(f"[Rainforest] Search HTTP error for '{keyword}': {e.response.status_code}")
        return []
    except Exception as e:
        print(f"[Rainforest] Search error for '{keyword}': {e}")
        return []
