"""
Conversational AI Chatbot Service
Uses LangChain RAG with ChromaDB, Gemini as primary LLM, and OpenRouter as fallback.
"""
import os
import asyncio
import hashlib
from typing import List, Dict

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langgraph.prebuilt import create_react_agent

from services.vector_store import get_retriever, ingest_data

SYSTEM_PROMPT = """You are PricePilot AI, an intelligent e-commerce pricing and inventory assistant.
You help merchants analyze demand, optimize pricing, and manage stock.
Answer the user's questions clearly, concisely, and professionally.

CRITICAL INSTRUCTIONS:
1. NO HALLUCINATIONS: If the answer is not contained within the provided context, chat history, or web search, you MUST say "I don't have that information." Do not guess prices, stock levels, or competitor data.
2. USE TOOLS: You have access to a Web Search tool. Use it whenever a user asks about current market trends, news, or competitor pricing that isn't in your context.
3. USE CONTEXT: Rely strictly on the real-time request context and memory chunks provided below for inventory data.
4. BE SPECIFIC: Use exact numbers, percentages, and names from the context.
5. CURRENCY & PRICING: The merchant's default store currency is INR (₹). Always quote catalog prices and competitor prices in INR (₹). Do NOT default to USD ($) unless explicitly asked. When comparing catalog prices with competitor market data retrieved from web search or AI knowledge, convert or state market prices in INR (₹) so price comparison logic is accurate and apples-to-apples (e.g. ₹600 bottle compared against market range ₹300-₹850 INR).
6. TONE: Be helpful, analytical, and direct. Avoid overly fluffy language.

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

        # Special handling for slash commands: /explain-simply and /what-if
        is_explain_simply = latest_query.lower().startswith('/explain-simply')
        is_what_if = latest_query.lower().startswith('/what-if')

        command_instructions = ""
        if is_explain_simply:
            command_instructions = (
                "\n\nSPECIAL INSTRUCTION FOR /explain-simply:\n"
                "Explain the user's query in 2 plain-English bullet points for a normal seller with zero technical background.\n"
                "1. Focus on what this means for their net profit (in ₹ INR).\n"
                "2. Focus on what exact practical action the seller should take.\n"
                "DO NOT use jargon like elasticity, variance, regression, or logit."
            )
        elif is_what_if:
            command_instructions = (
                "\n\nSPECIAL INSTRUCTION FOR /what-if:\n"
                "The user is asking a What-If scenario (e.g. '/what-if i changed @Redmi A7 price to 800rs').\n"
                "You MUST provide a clear, helpful, 2-sentence seller summary of the expected price change impact right in the message:\n"
                "1. State whether this is an OVERALL GOOD DECISION, RISKY DECISION, or NEUTRAL DECISION.\n"
                "2. Explain in plain seller English the projected net profit change in ₹ INR and sales volume impact.\n"
                "3. At the VERY END of your response, append exact line:\n"
                "---ACTION_REDIRECT_WHAT_IF---\n"
                "followed on a new line by a single valid JSON object with keys: {\"action\": \"redirect_what_if\", \"productQuery\": \"<extracted product name>\", \"priceChange\": \"<extracted target price value>\"}\n"
                "Example response format:\n"
                "Changing the price of 'Premium Steel Hot and Cold Bottle 750ml' to ₹800 is an OVERALL GOOD DECISION. Lowering the price from ₹900 to ₹800 is estimated to boost sales volume by +18%, generating +₹4,500 (+8.2%) in net monthly profit.\n\n"
                "---ACTION_REDIRECT_WHAT_IF---\n"
                "{\"action\": \"redirect_what_if\", \"productQuery\": \"Premium Steel Hot and Cold Bottle 750ml\", \"priceChange\": \"800\"}"
            )

        full_system_prompt = SYSTEM_PROMPT.format(context=context_str) + command_instructions
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
        raw_content = result["messages"][-1].content
        
        # Handle cases where the LLM returns a list of content blocks (e.g., tool calls + text)
        if isinstance(raw_content, list):
            # Extract all text blocks and join them
            response = " ".join([c.get("text", "") for c in raw_content if isinstance(c, dict) and c.get("type") == "text" and "text" in c])
            if not response.strip():
                # Fallback if no text block found
                response = str(raw_content)
        else:
            response = str(raw_content)
        
        # Save to episodic memory asynchronously (fire-and-forget for now)
        memory.save_episodic_interaction(latest_query, response)
        
        return response
    except Exception as e:
        import traceback
        print(f"Chatbot LangGraph Error: {e}")
        traceback.print_exc()
        return "Oops! I encountered an error while processing your request. Please try again later."
