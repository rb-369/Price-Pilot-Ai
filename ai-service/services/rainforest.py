"""
Rainforest API Service
Fetches real-time competitor pricing data from Amazon via Rainforest API.
Docs: https://www.rainforestapi.com/docs
"""
import os
import re
import httpx
import asyncio
from typing import List, Dict, Optional
from datetime import datetime, timezone

RAINFOREST_API_KEY = os.getenv("RAINFOREST_API_KEY", "")
RAINFOREST_BASE_URL = "https://api.rainforestapi.com/request"
REQUEST_TIMEOUT = 30.0

def _extract_price_value(price_raw) -> Optional[float]:
    """Helper to safely extract float price from dict, float, int, or string."""
    if price_raw is None:
        return None
    if isinstance(price_raw, (int, float)):
        return float(price_raw)
    if isinstance(price_raw, dict):
        val = price_raw.get("value") if price_raw.get("value") is not None else (price_raw.get("raw") or price_raw.get("extracted"))
        return _extract_price_value(val)
    if isinstance(price_raw, str):
        clean_str = price_raw.replace(",", "")
        match = re.search(r"\d+(?:\.\d+)?", clean_str)
        if match:
            try:
                return float(match.group(0))
            except ValueError:
                return None
    return None


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
        price_value = _extract_price_value(buybox.get("price")) or _extract_price_value(product.get("price"))

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
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "rainforest_api",
        }

    except httpx.HTTPStatusError as e:
        print(f"[Rainforest] HTTP error for ASIN {asin}: {e.response.status_code}")
        return await _fetch_product_by_asin_serpapi(asin, amazon_domain)
    except httpx.RequestError as e:
        print(f"[Rainforest] Request error for ASIN {asin}: {e}")
        return await _fetch_product_by_asin_serpapi(asin, amazon_domain)
    except Exception as e:
        print(f"[Rainforest] Unexpected error for ASIN {asin}: {e}")
        return await _fetch_product_by_asin_serpapi(asin, amazon_domain)

async def _fetch_product_by_asin_serpapi(asin: str, amazon_domain: str) -> Optional[Dict]:
    """Fallback: Fetch specific ASIN from SerpApi Amazon Product Engine"""
    import os
    import httpx
    from datetime import datetime
    serpapi_key = os.getenv("SERPAPI_KEY", "")
    if not serpapi_key:
        print("[SerpApi] No SERPAPI_KEY configured for ASIN fallback.")
        return None

    print(f"[SerpApi] Attempting Amazon product fallback for ASIN '{asin}'...")
    params = {
        "engine": "amazon_product",
        "asin": asin,
        "amazon_domain": amazon_domain,
        "api_key": serpapi_key,
    }

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.get("https://serpapi.com/search.json", params=params)
            response.raise_for_status()
            data = response.json()

        product = data.get("product", {})
        if not product:
            return None

        # Extract buybox / listing price
        buybox = product.get("buybox_winner", {})
        price_value = _extract_price_value(buybox.get("price")) or _extract_price_value(product.get("price"))

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
            "ratingsTotal": product.get("reviews"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "serpapi_amazon_product",
        }
    except Exception as e:
        print(f"[SerpApi] Product fallback error for ASIN '{asin}': {e}")
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


def _build_cross_brand_queries(keyword: str, brand: Optional[str], category: Optional[str], price: Optional[float]) -> List[str]:
    raw_name = keyword or ''
    brand_name = (brand or '').strip()
    cat = (category or 'General').lower()
    p_val = price or 0
    p_round = int(round(p_val / 1000.0) * 1000) if p_val >= 3000 else int(p_val)

    brand_upper = brand_name.upper()
    name_upper = raw_name.upper()

    queries = []

    # Mobiles & Electronics
    if any(k in cat or k in name_upper for k in ['MOBILE', 'ELECTRONIC', 'PHONE', '5G', 'RAM', 'REDMI', 'REALME', 'SAMSUNG', 'OPPO', 'VIVO', 'POCO']):
        mobile_brands = [b for b in ['Oppo', 'Vivo', 'Realme', 'Samsung', 'Poco', 'Motorola', 'OnePlus'] if b.upper() != brand_upper]
        for b in mobile_brands[:4]:
            if p_round > 0:
                queries.append(f"{b} 5G mobile under {p_round}")
            else:
                queries.append(f"{b} 5G mobile")
        queries.append(f"5G smartphone under {p_round}" if p_round > 0 else "5G smartphone")

    # Laptops
    elif 'laptop' in cat or 'LAPTOP' in name_upper or 'NOTEBOOK' in name_upper:
        laptop_brands = [b for b in ['Lenovo', 'HP', 'Dell', 'ASUS', 'Acer', 'MSI'] if b.upper() != brand_upper]
        for b in laptop_brands[:3]:
            queries.append(f"{b} laptop under {p_round}" if p_round > 0 else f"{b} laptop")
        queries.append("laptop")

    # Audio & Wearables
    elif any(k in cat or k in name_upper for k in ['AUDIO', 'FITNESS', 'EARBUDS', 'WATCH', 'HEADPHONE', 'SPEAKER']):
        audio_brands = [b for b in ['Boat', 'Noise', 'Boult', 'JBL', 'Sony', 'Fire-Boltt'] if b.upper() != brand_upper]
        for b in audio_brands[:3]:
            queries.append(f"{b} wireless earbuds")
    # Fallback
    else:
        clean = raw_name
        if brand_name:
            clean = re.sub(re.escape(brand_name), '', clean, flags=re.IGNORECASE).strip()
        queries.append(f"{clean} under {p_round}" if p_round > 0 else clean)

    return queries


def _filter_brand_diversity(items: List[Dict], user_brand: Optional[str], max_results: int = 6) -> List[Dict]:
    seen_urls = set()
    user_b = (user_brand or '').upper()

    brand_buckets = {}
    
    for item in items:
        url = item.get('url', '')
        if not url or url in seen_urls:
            continue
        seen_urls.add(url)

        title = item.get('productName', '')
        # Detect brand from title
        detected_brand = 'Other'
        for b in ['OPPO', 'VIVO', 'REALME', 'SAMSUNG', 'POCO', 'MOTOROLA', 'ONEPLUS', 'REDMI', 'XIAOMI', 'ASUS', 'DELL', 'HP', 'LENOVO', 'APPLE', 'BOAT', 'NOISE', 'BOULT', 'JBL', 'SONY']:
            if b in title.upper():
                detected_brand = b.capitalize()
                break
        
        item['brand'] = detected_brand
        item['isSelfBrand'] = bool(user_b and detected_brand.upper() == user_b)

        if detected_brand not in brand_buckets:
            brand_buckets[detected_brand] = []
        brand_buckets[detected_brand].append(item)

    diverse_results = []
    
    # 1. Include 1 self-brand item if available as baseline channel offer
    self_items = [it for bucket in brand_buckets.values() for it in bucket if it.get('isSelfBrand')]
    if self_items:
        diverse_results.append(self_items[0])

    # 2. Pick 1 from each competitor brand bucket (Oppo, Vivo, Realme, Samsung, Poco, etc.)
    rival_buckets = [bucket for b_name, bucket in brand_buckets.items() if not bucket[0].get('isSelfBrand')]
    
    idx = 0
    while len(diverse_results) < max_results and any(idx < len(b) for b in rival_buckets):
        for bucket in rival_buckets:
            if idx < len(bucket) and len(diverse_results) < max_results:
                diverse_results.append(bucket[idx])
        idx += 1

    # 3. Fallback to fill remaining slots if needed
    if len(diverse_results) < max_results:
        for item in items:
            if item not in diverse_results and len(diverse_results) < max_results:
                diverse_results.append(item)

    return diverse_results


async def search_competitors_by_keyword(
    keyword: str,
    amazon_domain: str = "amazon.in",
    max_results: int = 6,
    asin: Optional[str] = None,
    brand: Optional[str] = None,
    category: Optional[str] = None,
    price: Optional[float] = None,
) -> List[Dict]:
    """
    Search Amazon and Flipkart for real cross-brand competitors (e.g. Oppo, Vivo, Realme, Samsung, Poco).
    """
    if not RAINFOREST_API_KEY:
        raise ValueError("RAINFOREST_API_KEY is not set in environment variables.")

    try:
        from services.flipkart_scraper import scrape_flipkart_prices
        import asyncio

        raw_items = []

        # 1. Primary ASIN listing if present
        if asin:
            res = await fetch_product_by_asin(asin, amazon_domain)
            if res:
                raw_items.append(res)

        # 2. Build Cross-Brand queries
        cross_queries = _build_cross_brand_queries(keyword, brand, category, price)

        search_tasks = []
        for q in cross_queries[:3]:
            search_tasks.append(scrape_flipkart_prices(q, max_results=2))

        main_amazon_q = cross_queries[-1] if cross_queries else keyword
        search_tasks.append(_fetch_amazon_search(main_amazon_q, amazon_domain, max_results=4))

        results_list = await asyncio.gather(*search_tasks, return_exceptions=True)

        for res in results_list:
            if isinstance(res, list):
                raw_items.extend(res)

        # 3. Apply Brand Diversity Filter
        final_competitors = _filter_brand_diversity(raw_items, user_brand=brand, max_results=max_results)
        return final_competitors

    except Exception as e:
        import traceback
        print(f"[Rainforest] Search error for '{keyword}': {e}")
        traceback.print_exc()
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
            price_value = _extract_price_value(item.get("price"))

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
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": "rainforest_search",
            })

        return competitors

    except httpx.HTTPStatusError as e:
        print(f"[Rainforest] Search HTTP error for '{keyword}': {e.response.status_code}")
        return await _fetch_amazon_search_serpapi(keyword, amazon_domain, max_results)
    except Exception as e:
        import traceback
        print(f"[Rainforest] Search error for '{keyword}': {e}")
        traceback.print_exc()
        return await _fetch_amazon_search_serpapi(keyword, amazon_domain, max_results)

async def _fetch_amazon_search_serpapi(keyword: str, amazon_domain: str, max_results: int) -> List[Dict]:
    """Fallback: Fetch from SerpApi Amazon Engine"""
    import os
    serpapi_key = os.getenv("SERPAPI_KEY", "")
    if not serpapi_key:
        print("[SerpApi] No SERPAPI_KEY configured for fallback.")
        return []

    print(f"[SerpApi] Attempting Amazon search fallback for '{keyword}'...")
    params = {
        "engine": "amazon",
        "k": keyword,
        "amazon_domain": amazon_domain,
        "api_key": serpapi_key,
    }
    
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.get("https://serpapi.com/search.json", params=params)
            response.raise_for_status()
            data = response.json()

        search_results = data.get("organic_results", [])
        if not search_results:
            search_results = data.get("amazon_results", [])
            
        search_results = search_results[:max_results]

        competitors = []
        for item in search_results:
            price_value = _extract_price_value(item.get("price"))
            if price_value is None:
                price_value = _extract_price_value(item.get("price_string")) or _extract_price_value(item.get("extracted_price"))

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
                "ratingsTotal": item.get("reviews"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": "serpapi_amazon_search",
            })

        return competitors
    except Exception as e:
        print(f"[SerpApi] Search fallback error for '{keyword}': {e}")
        return []
