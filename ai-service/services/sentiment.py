"""
Sentiment Analysis Service
Uses Google Generative AI (Gemini) to analyze product sentiment from simulated reviews or real data.
Outputs a sentiment score from 0 to 100.
"""
import os
import json

PROMPT_TEMPLATE = """You are an expert consumer sentiment analyst. 
Analyze the following product details and associated recent feedback or trends.
Determine a sentiment score from 0 to 100, where 0 is extremely negative, 50 is neutral, and 100 is extremely positive.

Product Name: {product_name}
Category: {category}
Feedback/Mentions: {feedback}

You must return ONLY a JSON object with the following schema:
{{
  "sentiment_score": integer (0-100),
  "analysis": "1-2 sentences explaining the score based on the feedback provided"
}}
"""

async def analyze_sentiment(product_name: str, category: str, feedback: str) -> dict:
    """Analyze sentiment and return a score."""
    api_key = os.getenv("LLM_API_KEY", "")
    
    if not api_key or api_key == "your_gemini_or_openai_key_here":
        # Fallback heuristic if API is not available
        score = 50
        if "great" in feedback.lower() or "love" in feedback.lower() or "excellent" in feedback.lower():
            score = 85
        elif "bad" in feedback.lower() or "terrible" in feedback.lower() or "poor" in feedback.lower():
            score = 25
        return {
            "sentiment_score": score,
            "analysis": "Simulated sentiment score due to missing API key."
        }
        
    prompt = PROMPT_TEMPLATE.format(
        product_name=product_name,
        category=category,
        feedback=feedback or "General social media mentions"
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
                temperature=0.3
            )
        )
        return json.loads(response.text.strip())
    except Exception as e:
        print(f"Sentiment analysis failed: {e}")
        return {
            "sentiment_score": 50,
            "analysis": "Failed to analyze sentiment."
        }
