"""
Flipkart Competitor Scraper
Scrapes Flipkart product prices via web scraping with httpx + BeautifulSoup.
Returns competitor price data in the same format as Rainforest API results.
"""
import httpx
import asyncio
import random
from typing import List, Dict, Optional
from datetime import datetime


# Flipkart search URL template
FLIPKART_SEARCH_URL = "https://www.flipkart.com/search?q={query}&sort=relevance"

# User agents for rotation to avoid blocks
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
]


async def scrape_flipkart_prices(
    keyword: str,
    max_results: int = 5,
) -> List[Dict]:
    """
    Scrape Flipkart search results for competitor pricing.

    Args:
        keyword: Product search query
        max_results: Maximum number of results to return

    Returns:
        List of competitor price dicts compatible with the existing format
    """
    try:
        html = await _fetch_search_page(keyword)
        if not html:
            print(f"[Flipkart] Failed to fetch search page for '{keyword}'")
            return []

        products = _parse_search_results(html, max_results)
        print(f"[Flipkart] Found {len(products)} results for '{keyword}'")
        return products

    except Exception as e:
        print(f"[Flipkart] Scraping error for '{keyword}': {e}")
        return []


async def _fetch_search_page(keyword: str) -> Optional[str]:
    """Fetch Flipkart search results page."""
    url = FLIPKART_SEARCH_URL.format(query=keyword.replace(" ", "+"))
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }

    async with httpx.AsyncClient(
        timeout=15,
        follow_redirects=True,
        headers=headers,
    ) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.text


def _parse_search_results(html: str, max_results: int) -> List[Dict]:
    """Parse Flipkart search results HTML to extract product data."""
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        print("[Flipkart] BeautifulSoup not installed, using regex fallback")
        return _regex_parse_fallback(html, max_results)

    soup = BeautifulSoup(html, "html.parser")
    products = []

    # Flipkart uses various class patterns for product cards
    # Try multiple selectors for robustness
    product_cards = (
        soup.select("div[data-id]") or
        soup.select("div._1AtVbE") or
        soup.select("div._4ddWXP") or
        soup.select("div._2kHMtA")
    )

    for card in product_cards[:max_results * 2]:  # Scan more to filter
        try:
            # Extract title
            title_el = (
                card.select_one("div._4rR01T") or
                card.select_one("a.s1Q9rs") or
                card.select_one("a._2rpwqI") or
                card.select_one("a.IRpwTa")
            )
            title = title_el.get_text(strip=True) if title_el else None

            # Extract price
            price_el = (
                card.select_one("div._30jeq3") or
                card.select_one("div._1_WHN1")
            )
            price_text = price_el.get_text(strip=True) if price_el else None

            if not title or not price_text:
                continue

            # Parse price: "₹1,299" → 1299.0
            price = _parse_price(price_text)
            if price is None or price <= 0:
                continue

            # Extract rating if available
            rating_el = card.select_one("div._3LWZlK") or card.select_one("div.XQDdHH")
            rating = None
            if rating_el:
                try:
                    rating = float(rating_el.get_text(strip=True))
                except ValueError:
                    pass

            products.append({
                "name": f"[Flipkart] {title[:80]}",
                "price": price,
                "inStock": True,
                "rating": rating,
                "timestamp": datetime.utcnow().isoformat(),
                "source": "flipkart_scrape",
            })

            if len(products) >= max_results:
                break

        except Exception:
            continue

    return products


def _parse_price(price_text: str) -> Optional[float]:
    """Parse Indian price format: '₹1,29,999' → 129999.0"""
    import re
    # Remove currency symbol and commas
    cleaned = re.sub(r'[₹,\s]', '', price_text)
    try:
        return float(cleaned)
    except ValueError:
        return None


def _regex_parse_fallback(html: str, max_results: int) -> List[Dict]:
    """Fallback parser using regex when BeautifulSoup is not available."""
    import re
    products = []

    # Find price patterns in HTML
    price_pattern = re.compile(r'₹\s*([\d,]+)')
    prices = price_pattern.findall(html)

    for i, price_str in enumerate(prices[:max_results]):
        try:
            price = float(price_str.replace(",", ""))
            if 10 < price < 1000000:  # Sanity check
                products.append({
                    "name": f"[Flipkart] Product {i + 1}",
                    "price": price,
                    "inStock": True,
                    "rating": None,
                    "timestamp": datetime.utcnow().isoformat(),
                    "source": "flipkart_regex",
                })
        except ValueError:
            continue

    return products


def get_mock_flipkart_prices(product_name: str, base_price: float) -> List[Dict]:
    """Mock Flipkart prices for development."""
    random.seed(hash(product_name) % 1000 + 42)

    mocks = [
        {"name": "[Flipkart] Seller A", "mult": 0.92},
        {"name": "[Flipkart] Seller B", "mult": 1.05},
        {"name": "[Flipkart] Seller C", "mult": 0.97},
    ]

    return [
        {
            "name": m["name"],
            "price": round(base_price * m["mult"] * random.uniform(0.97, 1.03), 2),
            "inStock": random.random() > 0.15,
            "rating": round(random.uniform(3.5, 4.7), 1),
            "timestamp": datetime.utcnow().isoformat(),
            "source": "mock_flipkart",
        }
        for m in mocks
    ]
