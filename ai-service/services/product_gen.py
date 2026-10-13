"""
AI Product Description Generator
Uses Google Generative AI (Gemini) to generate SEO-optimized product titles, descriptions, and tags.
"""
import os
import json

PROMPT_TEMPLATE = """You are an expert e-commerce copywriter and SEO specialist. 
Based on the following product information, generate an optimized product title, a compelling product description, and relevant SEO tags.

Product Name / Keywords: {product_name}
Category/Context: {category}

IMPORTANT CONSTRAINTS:
1. DO NOT include any real-world brand names, trademarks, or competitor names (e.g., Apple, Nike, Logitech, Ergotron, etc.) unless explicitly provided in the Product Name. 
2. Keep the copy generic, white-label, or unbranded, focusing entirely on features, quality, and benefits.

You must return ONLY a JSON object with the following schema:
{{
  "title": "Optimized, catchy product title (max 60 chars)",
  "description": "Compelling, benefit-driven product description (2-3 paragraphs)",
  "seo_tags": ["list", "of", "5-7", "seo", "keywords"]
}}
"""

async def generate_product_copy(product_name: str, category: str = "") -> dict:
    """Generate SEO-optimized product copy."""
    raw_keys = [
        os.getenv("CHATBOT_API_KEY", "").strip(),
        os.getenv("LLM_API_KEY", "").strip(),
        os.getenv("GEMINI_API_KEY", "").strip(),
    ]
    candidate_keys = [k for k in raw_keys if k and not k.startswith("sk-or-") and k != "your_gemini_or_openai_key_here"]
    candidate_keys = list(dict.fromkeys(candidate_keys))

    default_copy = {
        "title": f"Premium {product_name}",
        "description": f"Experience the best quality with our {product_name}. Designed for maximum performance and reliability in the {category or 'General E-commerce'} space. Order now and see the difference.",
        "seo_tags": [product_name, category or "general", "premium", "best quality", "buy online"]
    }
        
    prompt = PROMPT_TEMPLATE.format(
        product_name=product_name,
        category=category or "General E-commerce"
    )
    
    # 1. Try Gemini across all candidate keys
    for api_key in candidate_keys:
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=api_key)
            for cand in ["gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-2.5-flash"]:
                try:
                    response = await client.aio.models.generate_content(
                        model=cand,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.7
                        )
                    )
                    if response.text:
                        return json.loads(response.text.strip())
                except Exception as model_err:
                    print(f"[product_gen] Model {cand} failed: {model_err}")
        except Exception as e:
            print(f"[product_gen] Gemini generation failed with key ({api_key[:8]}...): {e}")

    # 2. Try OpenRouter fallback
    openrouter_key = (
        os.getenv("OPENROUTER_API_KEY", "").strip() or 
        os.getenv("OPEN_ROUTER_API_KEY", "").strip()
    )
    if openrouter_key:
        try:
            import httpx
            headers = {
                "Authorization": f"Bearer {openrouter_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://pricepilot.ai",
                "X-Title": "PricePilot AI Product Generator"
            }
            fallback_models = [
                "poolside/laguna-s-2.1:free",
                "nvidia/nemotron-3.5-lightning:free",
                "google/gemma-4-31b-it:free",
                "liquid/lfm-2.5-2.6b:free",
                "nvidia/nemotron-3-super-120b-a12b:free",
                "poolside/laguna-xs-2.1:free",
                "openrouter/free"
            ]
            async with httpx.AsyncClient(timeout=30.0) as http_client:
                for model_name in fallback_models:
                    try:
                        data = {
                            "model": model_name,
                            "messages": [{"role": "user", "content": prompt}],
                            "temperature": 0.7,
                        }
                        resp = await http_client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
                        if resp.status_code == 200:
                            resp_json = resp.json()
                            content = resp_json["choices"][0]["message"]["content"].strip()
                            if content.startswith("```json"):
                                content = content[7:-3].strip()
                            elif content.startswith("```"):
                                content = content[3:-3].strip()
                            return json.loads(content)
                    except Exception as m_err:
                        print(f"[OpenRouter product_gen] Model {model_name} failed: {m_err}")
                        continue
        except Exception as fallback_err:
            print(f"OpenRouter fallback also failed: {fallback_err}")
    
    return default_copy
