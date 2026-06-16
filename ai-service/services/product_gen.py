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
        print(f"Product generation failed: {e}")
        return {
            "title": product_name,
            "description": "Failed to generate description due to AI service error.",
            "seo_tags": []
        }
