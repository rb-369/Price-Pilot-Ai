"""
LLM Insight Generator
Uses Google Generative AI (Gemini) for plain-English explanations.
Falls back to template-based insights when no API key is available.
"""
import os
from typing import Dict, Optional


INSIGHT_PROMPT_TEMPLATE = """You are an AI pricing analyst for an e-commerce platform. Generate a clear, actionable insight based on the following data:

Product: {product_name}
Current Price: ₹{current_price}
Recommended Price: ₹{recommended_price}
Price Change: {price_change}%
Base Cost: ₹{base_cost}
Stock Level: {stock_level} units
Reorder Threshold: {reorder_threshold} units

Competitor Data:
{competitor_summary}

Demand Signals:
{demand_summary}

Revenue Impact: {revenue_impact}%
Confidence Score: {confidence}

Generate a 2-3 sentence plain-English explanation of:
1. WHY this price change is recommended
2. WHAT factors are driving the recommendation
3. WHAT the expected outcome will be

Be specific with numbers. Use a professional but accessible tone. Do not use bullet points."""


async def generate_insight(
    product: Dict,
    recommendation: Dict,
    competitor_prices: list = None,
    demand_signals: list = None,
) -> str:
    """Generate plain-English insight using LLM or fallback template."""

    api_key = os.getenv("LLM_API_KEY", "")

    # Try LLM first
    if api_key and api_key != "your_gemini_or_openai_key_here":
        try:
            return await _generate_with_gemini(api_key, product, recommendation, competitor_prices, demand_signals)
        except Exception as e:
            print(f"LLM generation failed, using template: {e}")

    # Fallback to template-based insight
    return _generate_template_insight(product, recommendation, competitor_prices, demand_signals)


async def _generate_with_gemini(
    api_key: str,
    product: Dict,
    recommendation: Dict,
    competitor_prices: list,
    demand_signals: list,
) -> str:
    """Generate insight using Google Gemini API."""
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-pro")

    # Build competitor summary
    comp_summary = "No competitor data available."
    if competitor_prices:
        lines = [f"- {cp.get('name', 'Unknown')}: ₹{cp.get('price', 0)} ({'in stock' if cp.get('inStock', True) else 'OUT OF STOCK'})"
                 for cp in competitor_prices[:5]]
        comp_summary = "\n".join(lines)

    # Build demand summary
    demand_summary = "No demand signals available."
    if demand_signals:
        scores = [ds.get("compositeDemandScore", 0.5) for ds in demand_signals[:7]]
        avg_score = sum(scores) / len(scores)
        trend = "rising" if len(scores) >= 2 and scores[0] > scores[-1] else "declining" if len(scores) >= 2 and scores[0] < scores[-1] else "stable"
        demand_summary = f"Average demand score: {avg_score:.2f}/1.0, trend: {trend}"

    prompt = INSIGHT_PROMPT_TEMPLATE.format(
        product_name=product.get("name", "Unknown"),
        current_price=product.get("currentPrice", 0),
        recommended_price=recommendation.get("recommendedPrice", 0),
        price_change=recommendation.get("priceChange", 0),
        base_cost=product.get("baseCost", 0),
        stock_level=product.get("stockLevel", 0),
        reorder_threshold=product.get("reorderThreshold", 0),
        competitor_summary=comp_summary,
        demand_summary=demand_summary,
        revenue_impact=recommendation.get("revenueImpact", 0),
        confidence=recommendation.get("confidenceScore", 0),
    )

    response = await model.generate_content_async(prompt)
    return response.text.strip()


def _generate_template_insight(
    product: Dict,
    recommendation: Dict,
    competitor_prices: list = None,
    demand_signals: list = None,
) -> str:
    """Generate template-based insight when LLM is not available."""
    rec_price = recommendation.get("recommendedPrice", 0)
    current_price = product.get("currentPrice", 0)
    price_change = recommendation.get("priceChange", 0)
    revenue_impact = recommendation.get("revenueImpact", 0)
    factors = recommendation.get("factors", {})

    direction = "increase" if price_change > 0 else "decrease" if price_change < 0 else "maintain"

    parts = []

    # Main recommendation
    if direction == "increase":
        parts.append(f"Recommend increasing price of {product.get('name', 'this product')} by {abs(price_change):.1f}% from ₹{current_price} to ₹{rec_price}.")
    elif direction == "decrease":
        parts.append(f"Recommend decreasing price of {product.get('name', 'this product')} by {abs(price_change):.1f}% from ₹{current_price} to ₹{rec_price}.")
    else:
        parts.append(f"Current pricing for {product.get('name', 'this product')} at ₹{current_price} is optimal.")

    # Factor analysis
    factor_parts = []
    comp_factor = factors.get("competitorFactor", 0)
    demand_factor = factors.get("demandFactor", 0)
    stock_factor = factors.get("stockFactor", 0)

    if abs(comp_factor) > 1:
        if comp_factor > 0:
            # Check for out of stock competitors
            oos = [cp for cp in (competitor_prices or []) if not cp.get("inStock", True)]
            if oos:
                factor_parts.append(f"competitor stockout detected ({', '.join([cp.get('name', '') for cp in oos[:2]])})")
            else:
                factor_parts.append("competitors are priced higher")
        else:
            factor_parts.append("competitor prices are lower")

    if abs(demand_factor) > 1:
        factor_parts.append(f"demand is {'rising' if demand_factor > 0 else 'declining'} ({abs(demand_factor):.1f}% shift)")

    if abs(stock_factor) > 1:
        factor_parts.append(f"{'low stock pressure' if stock_factor > 0 else 'overstock detected'}")

    if factor_parts:
        parts.append(f"Key drivers: {', '.join(factor_parts)}.")

    # Revenue impact
    if abs(revenue_impact) > 0.5:
        parts.append(f"Expected revenue impact: {revenue_impact:+.1f}% based on demand elasticity analysis.")

    return " ".join(parts)
