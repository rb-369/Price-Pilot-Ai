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
Context Information below is automatically retrieved from the PricePilot vector database and active memory:
{context}
"""

class WorkingMemory:
    """
    Represents the ephemeral Context RAM for an AI Agent Session.
    Aggregates System Prompt, Current Chat History, User Prompt, and RAG Context.
    """
    def __init__(self, messages: List[Dict], context_data: Dict = None):
        self.messages = messages
        self.context_data = context_data
        self.semantic_retriever = get_retriever(k=2, collection_name="semantic_memory")
        self.episodic_retriever = get_retriever(k=2, collection_name="episodic_memory")

    async def build_context_string(self, latest_query: str) -> str:
        context_parts = []
        
        # 1. Real-time API Context
        if self.context_data:
            import json
            context_parts.append("### Real-time Request Context:\n" + json.dumps(self.context_data, indent=2))
            
        # 2. RAG from Semantic Memory (Durable facts & rules)
        try:
            semantic_docs = await self.semantic_retriever.ainvoke(latest_query)
            if semantic_docs:
                semantic_text = "\n".join([d.page_content for d in semantic_docs])
                context_parts.append("### Semantic Memory (Facts):\n" + semantic_text)
        except Exception as e:
            print(f"Semantic RAG error: {e}")
            
        # 3. RAG from Episodic Memory (Past events)
        try:
            episodic_docs = await self.episodic_retriever.ainvoke(latest_query)
            if episodic_docs:
                episodic_text = "\n".join([d.page_content for d in episodic_docs])
                context_parts.append("### Episodic Memory (Past Events):\n" + episodic_text)
        except Exception as e:
            print(f"Episodic RAG error: {e}")
            
        return "\n\n".join(context_parts) if context_parts else "No additional context available."

    def get_langchain_history(self) -> List:
        chat_history = []
        for msg in self.messages[:-1]:
            if msg["role"] == "user":
                chat_history.append(HumanMessage(content=msg["content"]))
            else:
                chat_history.append(AIMessage(content=msg["content"]))
        return chat_history

    def get_latest_query(self) -> str:
        return self.messages[-1]["content"] if self.messages else ""

    def save_episodic_interaction(self, query: str, response: str):
        """Save this specific turn to Episodic Memory for future recall and summarization."""
        try:
            interaction = {
                "id": str(hash(query + response)),
                "query": query,
                "response": response,
                "type": "chat_interaction"
            }
            ingest_data([interaction], data_type="chat_interaction", collection_name="episodic_memory")
        except Exception as e:
            print(f"Failed to save episodic interaction: {e}")

async def chat_with_ai(messages: List[Dict], context_data: Dict = None) -> str:
    """
    Process a chat conversation using the Ephemeral Working Memory architecture.
    """
    # Initialize ephemeral Working Memory for this session
    memory = WorkingMemory(messages, context_data)
    latest_query = memory.get_latest_query()

    context_str = await memory.build_context_string(latest_query)
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
        chat_history = memory.get_langchain_history()
        # 7. Invoke Chain (always runs, even if retrieval failed)
        # Invoke Chain
        response = await rag_chain.ainvoke({
            "context": context_str,
            "input": latest_query,
            "chat_history": chat_history
        })
        
        # Save to episodic memory asynchronously (fire-and-forget for now)
        memory.save_episodic_interaction(latest_query, response)
        
        return response
    except Exception as e:
        print(f"Chatbot Chain Error: {e}")
        return "Oops! I encountered an error while processing your request. Please try again later."
