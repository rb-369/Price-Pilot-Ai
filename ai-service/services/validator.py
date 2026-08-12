import os
import json
from typing import List, Dict

VALIDATION_PROMPT = """You are an e-commerce data validation expert.
Your job is to compare a user's product with a list of scraped competitor products, and filter out any competitor products that are NOT actually competing items.

User's Product: "{product_name}"

Scraped Competitors:
{competitors_json}

INSTRUCTIONS:
1. Review each scraped competitor.
2. If the competitor product is completely irrelevant, an accessory (e.g., selling a case when the user sells a phone), or a vastly different category, mark it as invalid.
3. If the competitor product is a similar item, a direct competitor, or a valid alternative for a buyer, mark it as valid.
4. Return a JSON array containing ONLY the indices (0-indexed) of the VALID competitors.

Example output:
[0, 2, 4]

Return strictly valid JSON and nothing else.
"""

async def validate_competitors(product_name: str, competitors: List[Dict]) -> List[Dict]:
    """
    Validates a list of scraped competitor products against the user's product name.
    Filters out junk or irrelevant products using an LLM.
    """
    api_key = os.getenv("GEMINI_API_KEY", "") or os.getenv("LLM_API_KEY", "")
    
    if not api_key or api_key == "your_gemini_or_openai_key_here" or not competitors:
        return competitors
        
    try:
        # Prepare competitors for prompt to save tokens (only name and price)
        slim_competitors = [
            {"index": i, "name": c.get("productName", c.get("name", "")), "price": c.get("price")}
            for i, c in enumerate(competitors)
        ]
        
        prompt = VALIDATION_PROMPT.format(
            product_name=product_name,
            competitors_json=json.dumps(slim_competitors, indent=2)
        )
        
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=api_key)
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        
        content = response.text.strip()
        
        # Parse the JSON array of valid indices
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
            
        valid_indices = json.loads(content)
        
        if not isinstance(valid_indices, list):
            raise ValueError("LLM did not return a list")
            
        filtered_competitors = [c for i, c in enumerate(competitors) if i in valid_indices]
        
        print(f"[Validator] Filtered {len(competitors)} down to {len(filtered_competitors)} valid competitors.")
        return filtered_competitors
        
    except Exception as e:
        print(f"[Validator] Error during validation: {e}. Returning original list.")
        return competitors


def validate_price_margin_guardrail(
    candidate_price: float,
    cogs: float,
    min_margin: float = 0.10
) -> Dict[str, Any]:
    """
    Financial Margin Guardrail & Fallback.
    Asserts candidate_price >= cogs * (1 + min_margin).
    If breached, returns floorPrice = cogs * (1 + min_margin) with margin_breach_warning: true.
    """
    min_allowed_price = float(np.ceil(cogs * (1.0 + min_margin)))
    
    if candidate_price < min_allowed_price:
        return {
            "valid": False,
            "recommendedPrice": min_allowed_price,
            "requestedPrice": candidate_price,
            "cogs": cogs,
            "minMargin": min_margin,
            "margin_breach_warning": True,
            "reason": f"Candidate price ₹{candidate_price} breaches minMargin ({min_margin * 100}%). Floor price ₹{min_allowed_price} applied."
        }

    return {
        "valid": True,
        "recommendedPrice": candidate_price,
        "cogs": cogs,
        "minMargin": min_margin,
        "margin_breach_warning": False,
        "reason": "Price satisfies financial margin guardrail."
    }

