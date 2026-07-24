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
    api_key = os.getenv("LLM_API_KEY", "")
    
    # Fallback if no API key
    if not api_key or api_key == "your_gemini_or_openai_key_here":
        return {
            "title": f"Premium {product_name}",
            "description": f"Experience the best quality with our {product_name}. Designed for maximum performance and reliability in the {category} space. Order now and see the difference.",
            "seo_tags": [product_name, category, "premium", "best quality", "buy online"]
        }
        
    prompt = PROMPT_TEMPLATE.format(
        product_name=product_name,
        category=category or "General E-commerce"
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
                temperature=0.7
            )
        )
        return json.loads(response.text.strip())
    except Exception as e:
        print(f"Gemini generation failed: {e}. Trying OpenRouter fallback...")
        openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
        if not openrouter_key:
            print("No OPENROUTER_API_KEY found for fallback.")
            return {
                "title": product_name,
                "description": "Failed to generate description due to AI service error.",
                "seo_tags": []
            }
        
        try:
            import httpx
            async with httpx.AsyncClient() as http_client:
                headers = {
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json"
                }
                data = {
                    "model": "google/gemini-2.5-flash", # Fallback to same model via OpenRouter or change if preferred
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                }
                
                resp = await http_client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=30.0
                )
                resp.raise_for_status()
                resp_json = resp.json()
                content = resp_json["choices"][0]["message"]["content"]
                
                # Strip markdown code blocks if the model wrapped the JSON in them
                if content.startswith("```json"):
                    content = content[7:-3].strip()
                elif content.startswith("```"):
                    content = content[3:-3].strip()
                    
                return json.loads(content)
        except Exception as fallback_err:
            print(f"OpenRouter fallback also failed: {fallback_err}")
            return {
                "title": product_name,
                "description": "Failed to generate description due to AI service error.",
                "seo_tags": []
            }
