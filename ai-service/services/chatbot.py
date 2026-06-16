"""
Conversational AI Chatbot Service
Uses Google Generative AI (Gemini) as the primary LLM.
Falls back to OpenRouter if Gemini fails or api key is missing.
"""
import os
import httpx
from typing import List, Dict

SYSTEM_PROMPT = """You are PricePilot AI, an intelligent e-commerce pricing and inventory assistant.
You help merchants analyze demand, optimize pricing, and manage stock.
Answer the user's questions clearly and concisely.
Use specific numbers when referring to data. 
"""

async def chat_with_ai(messages: List[Dict], context_data: Dict = None) -> str:
    """
    Process a chat conversation.
    messages: list of dicts with 'role' ('user' or 'model'/'assistant') and 'content'
    context_data: optional dict with product, competitor, and demand data to use as RAG context.
    """
    gemini_key = os.getenv("CHATBOT_API_KEY", "")
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
    
    # Prepend context to the first message if provided
    formatted_messages = messages.copy()
    if context_data and len(formatted_messages) > 0:
        context_str = "\n--- SYSTEM CONTEXT ---\n"
        if "products" in context_data:
            context_str += f"Total Products: {len(context_data['products'])}\n"
            for p in context_data["products"][:5]:
                context_str += f"- {p.get('name')}: Price ₹{p.get('currentPrice')}, Stock: {p.get('stockLevel')}\n"
        if "alerts" in context_data:
            context_str += f"Active Alerts: {len(context_data['alerts'])}\n"
        context_str += "----------------------\n\n"
        
        # Add context to the latest user message
        formatted_messages[-1]["content"] = context_str + formatted_messages[-1]["content"]

    error_msg = None
    
    # Try Gemini First
    if gemini_key and gemini_key != "your_gemini_key_here":
        try:
            return await _chat_gemini(gemini_key, formatted_messages)
        except Exception as e:
            error_msg = str(e)
            print(f"Gemini Chatbot failed, falling back to OpenRouter: {e}")
            
    # Fallback to OpenRouter
    if openrouter_key and openrouter_key != "your_openrouter_key_here":
        try:
            return await _chat_openrouter(openrouter_key, formatted_messages)
        except Exception as e:
            print(f"OpenRouter Fallback failed: {e}")
            return f"Error: Both primary (Gemini) and fallback (OpenRouter) AI services failed. Details: {e}"
            
    if error_msg:
         return f"AI Service Error: {error_msg}. Please check your API keys."
    return "Error: No valid CHATBOT_API_KEY or OPENROUTER_API_KEY found in environment variables."

async def _chat_gemini(api_key: str, messages: List[Dict]) -> str:
    """Chat using Google Gemini API directly"""
    from google import genai
    from google.genai import types
    
    client = genai.Client(api_key=api_key)
    
    # Convert standard [{role, content}] to Gemini Format
    gemini_history = []
    for msg in messages[:-1]:  # All except the last one
        role = "user" if msg["role"] == "user" else "model"
        gemini_history.append(types.Content(role=role, parts=[types.Part.from_text(text=msg["content"])]))
        
    latest_message = messages[-1]["content"]
    
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Content(role="user", parts=[types.Part.from_text(text=SYSTEM_PROMPT + "\n\n" + latest_message)])
        ] if not gemini_history else gemini_history + [types.Content(role="user", parts=[types.Part.from_text(text=latest_message)])]
    )
    return response.text.strip()

async def _chat_openrouter(api_key: str, messages: List[Dict]) -> str:
    """Fallback chat using OpenRouter (e.g. using a free or alternate model)"""
    # OpenRouter expects openai format: role "user" or "assistant"
    or_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in messages:
        role = "assistant" if msg["role"] == "model" else msg["role"]
        or_messages.append({"role": role, "content": msg["content"]})
        
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "http://localhost:5173", # Optional, for OpenRouter rankings
                "X-Title": "PricePilot AI",
            },
            json={
                "model": "nvidia/nemotron-3-ultra-550b-a55b:free", # Or any other fallback like meta-llama/llama-3-8b-instruct
                "messages": or_messages
            }
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
