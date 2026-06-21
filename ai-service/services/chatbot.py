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
    # 1. Optionally ingest on-the-fly context (non-blocking)
    if context_data:
        try:
            if "products" in context_data:
                ingest_data(context_data["products"], data_type="product")
            if "alerts" in context_data:
                ingest_data(context_data["alerts"], data_type="alert")
        except Exception as e:
            print(f"Warning: Failed to ingest on-the-fly context into Chroma: {e}")

    # Combine API keys for fallback safety
    gemini_key = os.getenv("CHATBOT_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY", "")
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")

    # 2. Setup primary LLM (Gemini)
    primary_llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=gemini_key,
    )
    
    # 3. Setup fallback LLM (OpenRouter)
    fallback_llm = ChatOpenAI(
        model="nvidia/nemotron-3-ultra-550b-a55b:free",
        base_url="https://openrouter.ai/api/v1",
        api_key=openrouter_key
    )
    
    # Apply LangChain fallbacks
    llm = primary_llm.with_fallbacks([fallback_llm])
    
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
    
    # 6. Try RAG retrieval, fall back to no-context if embeddings fail
    context_str = "No additional context available."
    try:
        retriever = get_retriever(k=4)
        docs = await retriever.ainvoke(latest_query)
        if docs:
            context_str = "\n\n".join([doc.page_content for doc in docs])
    except Exception as e:
        print(f"Warning: Vector retrieval failed (chatbot will answer without RAG context): {e}")
    
    # 7. Invoke Chain (always runs, even if retrieval failed)
    try:
        response = await rag_chain.ainvoke({
            "context": context_str,
            "input": latest_query,
            "chat_history": chat_history
        })
        return response
    except Exception as e:
        print(f"Chatbot Chain Error: {e}")
        return "Oops! I encountered an error while processing your request. Please try again later."
