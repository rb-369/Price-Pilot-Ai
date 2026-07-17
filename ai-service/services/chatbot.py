"""
Conversational AI Chatbot Service
Uses LangChain RAG with ChromaDB, Gemini as primary LLM, and OpenRouter as fallback.
"""
import os
from typing import List, Dict

from langchain_core.messages import HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser

from services.vector_store import get_retriever, ingest_data

SYSTEM_PROMPT = """You are PricePilot AI, an intelligent e-commerce pricing and inventory assistant.
You help merchants analyze demand, optimize pricing, and manage stock.
Answer the user's questions clearly and concisely.
Use specific numbers when referring to data.

--- 
Context Information below is automatically retrieved from the PricePilot vector database:
{context}
"""

async def chat_with_ai(messages: List[Dict], context_data: Dict = None) -> str:
    """
    Process a chat conversation using RAG.
    messages: list of dicts with 'role' ('user' or 'model'/'assistant') and 'content'
    context_data: optional dict with data sent from frontend on-the-fly.
    """
    # We receive context directly from the Node backend for this specific user.
    # To prevent cross-account data leaks, we inject this directly into the prompt
    # instead of storing and retrieving it from a global vector database.
    context_str = "No additional context available."
    if context_data:
        import json
        context_str = json.dumps(context_data, indent=2)

    # Combine API keys for fallback safety
    gemini_key = os.getenv("CHATBOT_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY", "")
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")

    try:
        if gemini_key:
            primary_llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=gemini_key,
            )
        else:
            primary_llm = None
        
        if openrouter_key:
            fallback_llm = ChatOpenAI(
                model="nvidia/nemotron-3-ultra-550b-a55b:free",
                base_url="https://openrouter.ai/api/v1",
                api_key=openrouter_key
            )
        else:
            fallback_llm = None
        
        if primary_llm and fallback_llm:
            llm = primary_llm.with_fallbacks([fallback_llm])
        elif primary_llm:
            llm = primary_llm
        elif fallback_llm:
            llm = fallback_llm
        else:
            return "Oops! No AI keys are configured for the chatbot. Please add LLM_API_KEY to your environment variables."
        
        # 4. Create RAG Chain
        prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}")
        ])
        
        rag_chain = (
            prompt
            | llm
            | StrOutputParser()
        )
        
        # 5. Format message history for LangChain
        chat_history = []
        for msg in messages[:-1]:
            if msg["role"] == "user":
                chat_history.append(HumanMessage(content=msg["content"]))
            else:
                chat_history.append(AIMessage(content=msg["content"]))
                
        latest_query = messages[-1]["content"] if messages else ""
        
        # 6. We already set context_str directly from the frontend request above.
        # No need to query ChromaDB for local user products.
        
        # 7. Invoke Chain (always runs, even if retrieval failed)
        response = await rag_chain.ainvoke({
            "context": context_str,
            "input": latest_query,
            "chat_history": chat_history
        })
        return response
    except Exception as e:
        print(f"Chatbot Chain Error: {e}")
        return "Oops! I encountered an error while processing your request. Please try again later."
