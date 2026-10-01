"""
Competitor Intelligence AI Agent using LangGraph.
Primary: OpenRouter (NVIDIA Nemotron, Qwen, OpenRouter free pool)
Fallback: Google Gemini (2.5 Flash, Flash Latest)
Safety Net: Deterministic Category & Brand Heuristics
"""

import os
import re
import json
import asyncio
from typing import TypedDict, List, Dict, Optional, Any
from datetime import datetime, timezone
import httpx
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END

load_dotenv("../.env")
load_dotenv(".env")

# Import search helpers from rainforest service
from services.rainforest import (
    _scrape_flipkart_with_fallback,
    _fetch_amazon_search,
    _filter_rival_competitors,
    _generate_rival_benchmark_fallbacks,
    _extract_brand_and_generic_info,
    clean_brand_name as heuristic_clean_brand,
)

SYSTEM_PROMPT = """You are an elite e-commerce market intelligence AI agent specialized in Indian and global marketplaces (Amazon.in, Flipkart).
Given a merchant's raw product title, brand, description, and price:
1. Identify the TRUE, CLEAN brand name (strip 'Visit the store', 'Brand:', 'By', casing quirks, etc.).
2. Extract the core GENERIC product type (e.g. 'double door refrigerator', 'running shoes', 'mechanical keyboard', 'sunscreen spf 50').
3. Detect the accurate broad category name.
4. Name the top 4-5 direct RIVAL / COMPETITOR brands in the exact same market tier.
   CRITICAL REQUIREMENT: Strictly NEVER include the product's own brand in rival_brands.
5. Generate 4 high-converting search queries for finding rival products on Amazon and Flipkart.
   Each query MUST combine one rival brand with the clean generic product type (e.g. 'LG double door refrigerator', 'Samsung double door refrigerator').

Return ONLY a valid JSON object matching this schema:
{
  "clean_brand": "Brand",
  "product_type": "generic product type",
  "detected_category": "Category Name",
  "rival_brands": ["Rival1", "Rival2", "Rival3", "Rival4"],
  "search_queries": [
    {"brand": "Rival1", "query": "Rival1 generic product type"},
    {"brand": "Rival2", "query": "Rival2 generic product type"},
    {"brand": "Rival3", "query": "Rival3 generic product type"},
    {"brand": "Rival4", "query": "Rival4 generic product type"}
  ]
}
"""

# State definition for LangGraph
class CompetitorDiscoveryState(TypedDict):
    product_name: str
    raw_brand: Optional[str]
    category: Optional[str]
    price: Optional[float]
    description: Optional[str]
    asin: Optional[str]
    amazon_domain: str
    max_results: int

    # Intelligence Extraction Output
    clean_brand: str
    product_type: str
    detected_category: str
    rival_brands: List[str]
    search_queries: List[Dict[str, str]]
    agent_used: str

    # Scraped Competitor Results
    competitors: List[Dict[str, Any]]


async def _extract_with_openrouter(prompt: str) -> Optional[Dict]:
    """Query OpenRouter with free Nemotron and Qwen models."""
    api_key = (
        os.getenv("OPENROUTER_API_KEY", "").strip()
        or os.getenv("OPEN_ROUTER_API_KEY", "").strip()
    )
    if not api_key:
        return None

    # Top free models on OpenRouter prioritizing NVIDIA Nemotron
    candidate_models = [
        "nvidia/nemotron-3-super-120b-a12b:free",
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "nvidia/nemotron-3.5-lightning:free",
        "qwen/qwen3.8-27b:free",
        "openrouter/free",
    ]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://pricepilot.ai",
        "X-Title": "PricePilot AI Competitor Intelligence",
    }

    async with httpx.AsyncClient(timeout=8.0) as client:
        for model in candidate_models:
            try:
                print(f"[CompetitorAgent] Attempting OpenRouter model '{model}'...")
                resp = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.2,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices")
                    if choices and len(choices) > 0 and choices[0].get("message"):
                        content = choices[0]["message"].get("content", "")
                        match = re.search(r"\{.*\}", content, re.DOTALL)
                        if match:
                            parsed = json.loads(match.group(0))
                            parsed["_agent"] = f"openrouter/{model}"
                            print(f"[CompetitorAgent] Successfully extracted intelligence via OpenRouter ({model})")
                            return parsed
                else:
                    print(f"[CompetitorAgent] OpenRouter model '{model}' returned HTTP {resp.status_code}")
            except Exception as e:
                print(f"[CompetitorAgent] OpenRouter model '{model}' failed: {type(e).__name__}")

    return None


async def _extract_with_gemini(prompt: str) -> Optional[Dict]:
    """Fallback to Google Gemini if OpenRouter is unreachable."""
    api_key = (
        os.getenv("LLM_API_KEY", "").strip()
        or os.getenv("GEMINI_API_KEY", "").strip()
        or os.getenv("CHATBOT_API_KEY", "").strip()
    )
    if not api_key:
        return None

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        for model in ["gemini-2.5-flash", "gemini-flash-latest"]:
            try:
                print(f"[CompetitorAgent] Attempting Gemini fallback model '{model}'...")
                resp = await client.aio.models.generate_content(
                    model=model,
                    contents=f"{SYSTEM_PROMPT}\n\nProduct Information:\n{prompt}",
                    config={"response_mime_type": "application/json"},
                )
                if resp.text:
                    parsed = json.loads(resp.text)
                    parsed["_agent"] = f"gemini/{model}"
                    print(f"[CompetitorAgent] Successfully extracted intelligence via Gemini ({model})")
                    return parsed
            except Exception as e:
                print(f"[CompetitorAgent] Gemini model '{model}' failed: {e}")
    except Exception as e:
        print(f"[CompetitorAgent] Gemini client error: {e}")

    return None


async def discover_rivals_node(state: CompetitorDiscoveryState) -> Dict[str, Any]:
    """
    LangGraph Node 1: Analyze product & discover genuine market rivals.
    Attempts OpenRouter (NVIDIA Nemotron / Qwen) -> Gemini -> Deterministic Heuristics.
    """
    product_title = state.get("product_name", "") or ""
    brand_hint = state.get("raw_brand", "") or ""
    category_hint = state.get("category", "") or ""
    price_hint = state.get("price")
    desc_hint = state.get("description", "") or ""

    prompt = f"Product Title: {product_title}\nBrand Hint: {brand_hint}\nCategory Hint: {category_hint}\nPrice: {price_hint}\nDescription: {desc_hint[:400]}"

    extracted = None

    # 1. Primary: OpenRouter (Nemotron / Free models)
    try:
        extracted = await _extract_with_openrouter(prompt)
    except Exception as e:
        print(f"[CompetitorAgent] OpenRouter pipeline error: {e}")

    # 2. Fallback: Google Gemini
    if not extracted or not extracted.get("rival_brands"):
        print("[CompetitorAgent] OpenRouter failed, falling back to Gemini...")
        try:
            extracted = await _extract_with_gemini(prompt)
        except Exception as e:
            print(f"[CompetitorAgent] Gemini pipeline error: {e}")

    # Validate output from AI
    clean_brand = ""
    product_type = ""
    detected_cat = ""
    rival_brands = []
    search_queries = []
    agent_used = "heuristic_fallback"

    if extracted and isinstance(extracted, dict):
        clean_brand = heuristic_clean_brand(extracted.get("clean_brand", "") or brand_hint)
        product_type = extracted.get("product_type", "").strip()
        detected_cat = extracted.get("detected_category", "").strip() or category_hint or "General"
        rival_brands = [b for b in extracted.get("rival_brands", []) if b and b.lower() != clean_brand.lower()]
        
        # Ensure queries have brand and query string
        for q in extracted.get("search_queries", []):
            if isinstance(q, dict) and q.get("query"):
                b = q.get("brand") or (rival_brands[0] if rival_brands else "")
                search_queries.append({"brand": b, "query": q["query"]})

        if clean_brand and rival_brands and search_queries:
            agent_used = extracted.get("_agent", "ai_agent")

    # 3. Safety Net: If AI extraction failed or was incomplete, use rule-based heuristics
    if not clean_brand or not rival_brands or not search_queries:
        print("[CompetitorAgent] AI extraction incomplete, engaging deterministic heuristics safety net.")
        h_brand, h_generic, h_cat, h_rivals = _extract_brand_and_generic_info(
            keyword=product_title, brand=brand_hint, category=category_hint
        )
        clean_brand = clean_brand or h_brand
        product_type = product_type or h_generic
        detected_cat = detected_cat or h_cat
        rival_brands = rival_brands or [r for r in h_rivals if r.lower() != clean_brand.lower()]
        
        if not search_queries:
            for r in rival_brands[:4]:
                search_queries.append({"brand": r, "query": f"{r} {product_type}"})

    print(f"[CompetitorAgent] Decision: Brand='{clean_brand}', Category='{detected_cat}', ProductType='{product_type}', Rivals={rival_brands[:4]}, Agent='{agent_used}'")

    return {
        "clean_brand": clean_brand,
        "product_type": product_type,
        "detected_category": detected_cat,
        "rival_brands": rival_brands,
        "search_queries": search_queries,
        "agent_used": agent_used,
    }


async def execute_market_search_node(state: CompetitorDiscoveryState) -> Dict[str, Any]:
    """
    LangGraph Node 2: Concurrently query marketplaces using AI-generated search queries.
    """
    search_queries = state.get("search_queries", [])
    amazon_domain = state.get("amazon_domain", "amazon.in")
    max_results = state.get("max_results", 6)
    clean_brand = state.get("clean_brand", "")
    rival_brands = state.get("rival_brands", [])
    product_type = state.get("product_type", "")
    price = state.get("price")
    cat_name = state.get("detected_category", "")
    asin = state.get("asin")

    primary_item = None
    excluded_asins = set()
    if asin:
        try:
            from services.rainforest import fetch_product_by_asin, is_same_brand
            primary_item = await fetch_product_by_asin(asin, amazon_domain)
            if primary_item:
                if clean_brand and is_same_brand(
                    primary_item.get("productName", ""),
                    primary_item.get("brand", ""),
                    clean_brand
                ):
                    excluded_asins.add(asin)
                    primary_item = None
        except Exception as e:
            print(f"[CompetitorAgent] Error fetching primary ASIN {asin}: {e}")

    search_tasks = []
    # Concurrently launch scraping tasks alternating Flipkart and Amazon
    for i, sq in enumerate(search_queries[:4]):
        q_text = sq["query"]
        target_brand = sq["brand"]
        if i % 2 == 0:
            search_tasks.append(_scrape_flipkart_with_fallback(q_text, target_brand, amazon_domain))
        else:
            search_tasks.append(_fetch_amazon_search(q_text, amazon_domain, max_results=2, target_brand=target_brand))

    results_list = await asyncio.gather(*search_tasks, return_exceptions=True)

    raw_items = []
    for res in results_list:
        if isinstance(res, list):
            raw_items.extend(res)
        elif isinstance(res, Exception):
            print(f"[CompetitorAgent] Search task error: {res}")

    # Filter and deduplicate results
    competitors = _filter_rival_competitors(
        items=raw_items,
        user_brand=clean_brand,
        excluded_asins=excluded_asins,
        rival_brands=rival_brands,
        generic_product=product_type,
        price=price,
        max_results=max_results,
        primary_item=primary_item,
        cat_name=cat_name,
    )

    # Infill benchmark fallbacks if needed
    if len(competitors) < max_results:
        needed = max_results - len(competitors)
        benchmarks = _generate_rival_benchmark_fallbacks(
            user_brand=clean_brand,
            generic_product=product_type,
            price=price,
            rival_brands=rival_brands,
            needed_count=needed,
        )
        for b in benchmarks:
            if not any(c.get("productName") == b["productName"] for c in competitors):
                competitors.append(b)

    # Stamp agent source and ensure asin key exists on every competitor item
    agent_used = state.get("agent_used", "ai_agent")
    for idx, c in enumerate(competitors):
        c["ai_agent"] = agent_used
        if "asin" not in c or not c["asin"]:
            c["asin"] = c.get("asin") or f"COMP_ASIN_{idx+1}"

    print(f"[CompetitorAgent] Final competitor count: {len(competitors[:max_results])}")
    return {"competitors": competitors[:max_results]}


# Build the LangGraph StateGraph
workflow = StateGraph(CompetitorDiscoveryState)
workflow.add_node("discover_rivals", discover_rivals_node)
workflow.add_node("execute_search", execute_market_search_node)

workflow.set_entry_point("discover_rivals")
workflow.add_edge("discover_rivals", "execute_search")
workflow.add_edge("execute_search", END)

competitor_discovery_graph = workflow.compile()


async def run_competitor_discovery_agent(
    product_name: str,
    raw_brand: Optional[str] = None,
    category: Optional[str] = None,
    price: Optional[float] = None,
    description: Optional[str] = None,
    asin: Optional[str] = None,
    amazon_domain: str = "amazon.in",
    max_results: int = 6,
) -> Dict[str, Any]:
    """
    Executes the LangGraph competitor discovery workflow.
    Returns clean brand, rivals, search queries, and scraped competitor pricing.
    """
    initial_state = {
        "product_name": product_name,
        "raw_brand": raw_brand,
        "category": category,
        "price": price,
        "description": description,
        "asin": asin,
        "amazon_domain": amazon_domain,
        "max_results": max_results,
        "clean_brand": "",
        "product_type": "",
        "detected_category": "",
        "rival_brands": [],
        "search_queries": [],
        "agent_used": "",
        "competitors": [],
    }

    final_state = await competitor_discovery_graph.ainvoke(initial_state)
    return {
        "competitors": final_state.get("competitors", []),
        "clean_brand": final_state.get("clean_brand", ""),
        "product_type": final_state.get("product_type", ""),
        "detected_category": final_state.get("detected_category", ""),
        "rival_brands": final_state.get("rival_brands", []),
        "agent_used": final_state.get("agent_used", ""),
    }
