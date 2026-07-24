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

IMPORTANT CONTEXT ON PROFIT MARGIN:
Our model optimizes for GROSS PROFIT (Price - Base Cost) * Volume, rather than just Revenue.
If the Recommended Price is higher than the Current Price, it means the model determined that the increase in per-unit profit margin outweighs the slight drop in sales volume. 
DO NOT flag a recommendation as "high risk" simply because the revenue impact is slightly negative, IF the price increase leads to a much stronger profit margin. Only flag as "high risk" if there's severe stock pressure or other alarming factors.

You must return ONLY a JSON object with the following schema:
{{
  "summary": "1-sentence summary of the recommendation",
  "detailed_analysis": "2-3 sentences explaining WHY and WHAT factors drove it",
  "action_items": ["List of 1 to 3 specific actions the merchant should take"],
  "risk_level": "low" | "medium" | "high"
}}
"""


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
            print(f"LLM generation failed, logging exception but using template: {e}")

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
    # Format competitor and demand summaries
    comp_summary = "No data"
    if competitor_prices:
        comp_summary = ", ".join([f"{cp.get('name', 'Unknown')}: ₹{cp.get('price', 0)}" for cp in competitor_prices])
        
    dem_summary = "No data"
    if demand_signals:
        dem_summary = f"{len(demand_signals)} demand signals processed."

    prompt = INSIGHT_PROMPT_TEMPLATE.format(
        product_name=product.get("name", "Unknown"),
        current_price=product.get("currentPrice", 0),
        recommended_price=recommendation.get("recommendedPrice", 0),
        price_change=recommendation.get("priceChange", 0),
        base_cost=product.get("baseCost", 0),
        stock_level=product.get("stockLevel", 0),
        reorder_threshold=product.get("reorderThreshold", 0),
        competitor_summary=comp_summary,
        demand_summary=dem_summary,
        revenue_impact=recommendation.get("revenueImpact", 0),
        confidence=recommendation.get("confidenceScore", 0),
    )

    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.4
            )
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini failed: {e}. Trying OpenRouter fallback...")
        try:
            import httpx
            import json
            import os
            or_key = os.getenv("OPENROUTER_API_KEY", api_key)
            if not or_key:
                return _generate_template_insight(product, recommendation, competitor_prices, demand_signals)
            headers = {
                "Authorization": f"Bearer {or_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": "meta-llama/llama-3-8b-instruct",
                "messages": [{"role": "user", "content": prompt + "\n\nCRITICAL: You MUST return ONLY a raw JSON object. Do not wrap in markdown blocks like ```json."}],
                "temperature": 0.4
            }
            async with httpx.AsyncClient(timeout=30) as http_client:
                resp = await http_client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
                resp.raise_for_status()
                resp_json = resp.json()
                content = resp_json["choices"][0]["message"]["content"].strip()
                if content.startswith("```json"):
                    content = content[7:-3].strip()
                elif content.startswith("```"):
                    content = content[3:-3].strip()
                return content
        except Exception as fallbackE:
            print(f"Fallback Exception: {fallbackE}")
            return _generate_template_insight(product, recommendation, competitor_prices, demand_signals)

def _generate_template_insight(
    product: Dict,
    recommendation: Dict,
    competitor_prices: list = None,
    demand_signals: list = None,
) -> str:
    import json
    return json.dumps({
        "summary": "AI generated insight fallback applied",
        "detailed_analysis": "Fallback insight generated due to API unavailability.",
        "action_items": ["Review pricing manually", "Check competitor stock"],
        "risk_level": "medium"
    })
