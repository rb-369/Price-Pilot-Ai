"""
Conversational AI Chatbot Service
Uses LangChain RAG with ChromaDB, Gemini as primary LLM, and OpenRouter as fallback.
"""
import os
import asyncio
import hashlib
from typing import List, Dict

from langchain_core.messages import HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser

from services.vector_store import get_retriever, ingest_data

SYSTEM_PROMPT = """You are PricePilot AI, an intelligent e-commerce pricing and inventory assistant.
You help merchants analyze demand, optimize pricing, and manage stock.
Answer the user's questions clearly, concisely, and professionally.

CRITICAL INSTRUCTIONS:
1. NO HALLUCINATIONS: If the answer is not contained within the provided context, chat history, or web search, you MUST say "I don't have that information." Do not guess prices, stock levels, or competitor data.
2. USE TOOLS: You have access to a Web Search tool. Use it whenever a user asks about current market trends, news, or competitor pricing that isn't in your context.
3. USE CONTEXT: Rely strictly on the real-time request context and memory chunks provided below for inventory data.
4. BE SPECIFIC: Use exact numbers, percentages, and names from the context.
5. TONE: Be helpful, analytical, and direct. Avoid overly fluffy language.

--- 
Context Information below is automatically retrieved from the PricePilot real-time database and vector memory:
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

        user_id = self.context_data.get('userId', 'global') if self.context_data else 'global'
        self.user_id = user_id

        # We initialized these explicitly in each method where they are needed rather than keeping them open all the time
        self._collection_name_semantic = f"semantic_memory_{user_id}"
        self._collection_name_episodic = f"episodic_memory_{user_id}"

    async def build_context_string(self, latest_query: str) -> str:
        context_parts = []

        # 1. Real-time API Context
        if self.context_data:
            import json
            context_parts.append("### Real-time Request Context:\n" + json.dumps(self.context_data, indent=2))

        # 2. RAG from Semantic Memory (Durable facts & rules)
        try:
            semantic_retriever = get_retriever(k=5, collection_name=self._collection_name_semantic)
            semantic_docs = await semantic_retriever.ainvoke(latest_query)
            if semantic_docs:
                semantic_text = "\n".join([d.page_content for d in semantic_docs])
                context_parts.append("### Semantic Memory (Facts):\n" + semantic_text)
        except Exception as e:
            print(f"Semantic RAG error: {e}")

        # 3. RAG from Episodic Memory (Past events)
        try:
            episodic_retriever = get_retriever(k=5, collection_name=self._collection_name_episodic)
            episodic_docs = await episodic_retriever.ainvoke(latest_query)
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
                "id": hashlib.sha256((query + response).encode('utf-8')).hexdigest(),
                "query": query,
                "response": response,
                "type": "chat_interaction"
            }
            # Run the synchronous ingest_data in a separate thread so it doesn't block the async event loop
            asyncio.create_task(asyncio.to_thread(ingest_data, [interaction], "chat_interaction", self._collection_name_episodic))
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
    gemini_key = os.getenv("LLM_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("CHATBOT_API_KEY", "")
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")

    try:
        if gemini_key:
            primary_llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=gemini_key,
            )
            secondary_llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-pro",
                google_api_key=gemini_key,
            )
        else:
            primary_llm = None
            secondary_llm = None
        
        if openrouter_key:
            fallback_llm = ChatOpenAI(
                model="google/gemma-4-31b-it:free",
                base_url="https://openrouter.ai/api/v1",
                api_key=openrouter_key
            )
        else:
            fallback_llm = None
        
        fallbacks = []
        if secondary_llm:
            fallbacks.append(secondary_llm)
        if fallback_llm:
            fallbacks.append(fallback_llm)
            
        if primary_llm and fallbacks:
            llm = primary_llm.with_fallbacks(fallbacks)
        elif primary_llm:
            llm = primary_llm
        elif fallback_llm:
            llm = fallback_llm
        else:
            return "Oops! No AI keys are configured for the chatbot. Please add LLM_API_KEY to your environment variables."
        
        # 4. Setup Tools
        tools = []
        tavily_key = os.getenv("TAVILY_API_KEY")
        if tavily_key:
            from langchain_community.tools.tavily_search import TavilySearchResults
            tools.append(TavilySearchResults(max_results=3))
        
        if not tools:
            from langchain_core.tools import tool
            @tool
            def dummy_search(query: str) -> str:
                """Dummy search tool."""
                return "Web search is currently disabled."
            tools.append(dummy_search)

        # 5. Create LangGraph Agent
        from langgraph.prebuilt import create_react_agent
        from langchain_core.messages import SystemMessage
        
        full_system_prompt = SYSTEM_PROMPT.format(context=context_str)
        # We pass tools, but remove state_modifier to support older langgraph versions
        agent = create_react_agent(llm, tools)
        
        # 6. Format message history for LangGraph
        all_messages = [SystemMessage(content=full_system_prompt)]
        for msg in messages:
            if msg["role"] == "user":
                all_messages.append(HumanMessage(content=msg["content"]))
            else:
                all_messages.append(AIMessage(content=msg["content"]))
                
        # 7. Invoke Agent
        result = await agent.ainvoke({"messages": all_messages})
        response = result["messages"][-1].content
        
        # Save to episodic memory asynchronously (fire-and-forget for now)
        memory.save_episodic_interaction(latest_query, response)
        
        return response
    except Exception as e:
        import traceback
        print(f"Chatbot LangGraph Error: {e}")
        traceback.print_exc()
        return "Oops! I encountered an error while processing your request. Please try again later."
