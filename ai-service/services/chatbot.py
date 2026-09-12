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
1. ACCURACY: If the answer is not contained within the provided context, chat history, or web search, say "I don't have that information." Do not guess random prices, stock levels, or competitor data. However, when the user asks a /what-if pricing scenario, you MUST use the product data in the context (baseCost, currentPrice, marginPercent, salesVelocity) to calculate and estimate the impact — this is NOT guessing, this is analysis.
2. USE TOOLS: You have access to a Web Search tool. Use it whenever a user asks about current market trends, news, or competitor pricing that isn't in your context.
3. USE CONTEXT: Rely strictly on the real-time request context and memory chunks provided below for inventory data.
4. BE SPECIFIC: Use exact numbers, percentages, and names from the context.
5. CURRENCY & PRICING: The merchant's default store currency is INR (₹). Always quote catalog prices and competitor prices in INR (₹). Do NOT default to USD ($) unless explicitly asked. When comparing catalog prices with competitor market data retrieved from web search or AI knowledge, convert or state market prices in INR (₹) so price comparison logic is accurate and apples-to-apples (e.g. ₹600 bottle compared against market range ₹300-₹850 INR).
6. TONE: Be helpful, analytical, and direct. Avoid overly fluffy language.
7. PRODUCT MATCHING: When the user mentions a product name (e.g., @"Premium Steel Hot and Cold Bottle 750ml"), find the matching product in the context by name. Use its baseCost, currentPrice, marginPercent, and salesVelocity data for any analysis.

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
            if semantic_retriever:
                semantic_docs = await semantic_retriever.ainvoke(latest_query)
                if semantic_docs:
                    semantic_text = "\n".join([d.page_content for d in semantic_docs])
                    context_parts.append("### Semantic Memory (Facts):\n" + semantic_text)
        except Exception as e:
            print(f"Semantic RAG error: {e}")

        # 3. RAG from Episodic Memory (Past events)
        try:
            episodic_retriever = get_retriever(k=5, collection_name=self._collection_name_episodic)
            if episodic_retriever:
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
                model="gemini-1.5-flash",
                google_api_key=gemini_key,
                max_retries=1,
            )
            secondary_llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                google_api_key=gemini_key,
                max_retries=1,
            )
        else:
            primary_llm = None
            secondary_llm = None
        
        fallbacks = []
        if secondary_llm:
            fallbacks.append(secondary_llm)
        
        if openrouter_key:
            for openrouter_model in [
                "meta-llama/llama-3.3-70b-instruct:free",
                "google/gemini-2.0-flash-exp:free",
                "mistralai/mistral-small-3.2-24b-instruct:free"
            ]:
                fallbacks.append(
                    ChatOpenAI(
                        model=openrouter_model,
                        base_url="https://openrouter.ai/api/v1",
                        api_key=openrouter_key,
                        max_retries=1,
                    )
                )
            
        if primary_llm and fallbacks:
            llm = primary_llm.with_fallbacks(fallbacks)
        elif primary_llm:
            llm = primary_llm
        elif fallbacks:
            llm = fallbacks[0].with_fallbacks(fallbacks[1:]) if len(fallbacks) > 1 else fallbacks[0]
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
        latest_lower = latest_query.lower().strip()
        is_explain_simply = 'explain-simply' in latest_lower
        is_what_if = 'what-if' in latest_lower or 'whatif' in latest_lower

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
                "The user is asking a What-If pricing scenario (e.g. '/what-if i changed @Product price to 790rs').\n"
                "STEP 1: Match the product in the context data by name. Extract its currentPrice, baseCost, marginPercent, and salesVelocity.\n"
                "NOTE: If the product is not found in context, assume baseline values: currentPrice = ₹900, baseCost = ₹540, marginPercent = 40%, salesVelocity = 0.5/hr.\n"
                "STEP 2: Calculate the new margin: newMargin = ((newPrice - baseCost) / newPrice) * 100.\n"
                "STEP 3: Calculate percentage price change: pctPriceChange = ((newPrice - currentPrice) / currentPrice) * 100.\n"
                "STEP 4: Estimate realistic sales volume impact and determine Verdict based on economic demand elasticity:\n"
                "  - If newPrice <= baseCost: Selling at or below cost! Estimated Sales Impact: +20% to +50%, but Verdict MUST be '🔴 RISKY DECISION' (loss-making per unit, destructive to business).\n"
                "  - If pctPriceChange > 100% (e.g. 2x, 10x, or 76x price surge): Catastrophic demand collapse! Estimated Sales Impact: -90% to -99%. Verdict MUST be '🔴 RISKY DECISION' (customers refuse to buy, listing loses Buy Box and conversion drops to zero).\n"
                "  - If pctPriceChange between +30% and +100%: Severe drop in sales! Estimated Sales Impact: -40% to -80%. Verdict MUST be '🔴 RISKY DECISION' (competitors will severely undercut you and volume drop outweighs per-unit gain).\n"
                "  - If pctPriceChange between +10% and +30%: Moderate price rise. Estimated Sales Impact: -15% to -35%. Compare net profit: if new unit margin covers volume loss, Verdict is '🟡 NEUTRAL' or '🟢 GOOD DECISION'. If volume drop hurts total profit, Verdict is '🔴 RISKY DECISION'.\n"
                "  - If pctPriceChange between 0% and +10%: Mild price optimization. Estimated Sales Impact: -3% to -10%. Per-unit margin usually offsets volume dip. Verdict: '🟢 GOOD DECISION'.\n"
                "  - If pctPriceChange between -1% and -20%: Strategic discount. Estimated Sales Impact: +10% to +35%. If profit margin remains healthy (>20%), Verdict: '🟢 GOOD DECISION'. If margin is destroyed, Verdict: '🔴 RISKY DECISION'.\n"
                "  - If pctPriceChange < -30%: Deep discount. Estimated Sales Impact: +30% to +60%. If margin becomes razor-thin (<10%), Verdict is '🔴 RISKY DECISION' or '🟡 NEUTRAL'.\n"
                "STEP 5: Provide the analysis in this exact format:\n\n"
                "📊 **What-If Analysis: [Product Name]**\n"
                "- **Current Price:** ₹[current] → **New Price:** ₹[new]\n"
                "- **Cost (COGS):** ₹[baseCost]\n"
                "- **Current Margin:** [old]% → **New Margin:** [new]%\n"
                "- **Estimated Sales Impact:** [+/- X%]\n"
                "- **Overall Verdict:** [🟢 GOOD DECISION / 🟡 NEUTRAL / 🔴 RISKY DECISION]\n\n"
                "[2-sentence plain-English summary for the seller explaining realistic profit, customer conversion, and volume impact. Explicitly warn if an extreme price hike will destroy sales volume and cause customer churn]\n\n"
                "STEP 6: At the VERY END of your response, append exact line:\n"
                "---ACTION_REDIRECT_WHAT_IF---\n"
                "followed on a new line by a single valid JSON object with keys: {\"action\": \"redirect_what_if\", \"productQuery\": \"<extracted product name>\", \"priceChange\": \"<extracted target price value>\"}\n"
                "Example:\n"
                "---ACTION_REDIRECT_WHAT_IF---\n"
                "{\"action\": \"redirect_what_if\", \"productQuery\": \"Premium Steel Hot and Cold Bottle 750ml\", \"priceChange\": \"790\"}\n\n"
                "CRITICAL MANDATE: NEVER say 'I don't have that information' or 'I don't have base cost'. You MUST output the What-If analysis and the ---ACTION_REDIRECT_WHAT_IF--- payload!"
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

        # Enforce ---ACTION_REDIRECT_WHAT_IF--- payload for /what-if queries if LLM omitted it
        if is_what_if and "---ACTION_REDIRECT_WHAT_IF---" not in response:
            import re
            import json
            p_match = re.search(r'@"?([^"\n\r?]+)"?', latest_query) or re.search(r'(?:of|for)\s+([A-Za-z0-9\s]+?)\s+(?:to|by)', latest_query, re.IGNORECASE)
            pr_match = re.search(r'(?:to|by)\s*(?:₹|rs\.?|inr)?\s*(\d+)', latest_query, re.IGNORECASE) or re.search(r'(\d+)\s*(?:rs|inr|₹)', latest_query, re.IGNORECASE)
            
            extracted_prod = p_match.group(1).strip() if p_match else "Product"
            extracted_price = pr_match.group(1).strip() if pr_match else ""
            
            payload_json = json.dumps({"action": "redirect_what_if", "productQuery": extracted_prod, "priceChange": extracted_price})
            response += f"\n\n---ACTION_REDIRECT_WHAT_IF---\n{payload_json}"
        
        return response
    except Exception as e:
        import traceback
        err_str = str(e).lower()
        print(f"Chatbot LangGraph Error: {e}")
        traceback.print_exc()

        # If it's a what-if query and LLM was rate-limited or failed, provide deterministic mathematical fallback
        if is_what_if:
            try:
                import re
                import json
                p_match = re.search(r'@"?([^"\n\r?]+)"?', latest_query) or re.search(r'(?:of|for)\s+([A-Za-z0-9\s]+?)\s+(?:to|by)', latest_query, re.IGNORECASE)
                pr_match = re.search(r'(?:to|by)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)', latest_query, re.IGNORECASE) or re.search(r'(\d+(?:\.\d+)?)\s*(?:rs|inr|₹)', latest_query, re.IGNORECASE)

                extracted_prod = p_match.group(1).strip() if p_match else "Product"
                extracted_price = float(pr_match.group(1).strip()) if pr_match else 0.0

                ctx_products = (context_data or {}).get("products", []) if isinstance(context_data, dict) else []
                matched_prod = next((p for p in ctx_products if extracted_prod.lower() in p.get("name", "").lower()), None)

                current_p = float(matched_prod.get("currentPrice", 900)) if matched_prod else 900.0
                base_c = float(matched_prod.get("baseCost", 540)) if matched_prod else 540.0
                new_p = extracted_price if extracted_price > 0 else current_p * 1.1

                old_margin = ((current_p - base_c) / current_p * 100.0) if current_p > 0 else 40.0
                new_margin = ((new_p - base_c) / new_p * 100.0) if new_p > 0 else 0.0
                pct_change = ((new_p - current_p) / current_p * 100.0) if current_p > 0 else 0.0

                if new_p <= base_c:
                    verdict = "🔴 RISKY DECISION"
                    sales_impact = "+25%"
                    explanation = f"Setting price to ₹{new_p:,.2f} is at or below cost (₹{base_c:,.2f}), resulting in negative margins and direct business losses."
                elif pct_change > 100:
                    verdict = "🔴 RISKY DECISION"
                    sales_impact = "-98%"
                    explanation = f"Increasing price by +{pct_change:.0f}% will cause catastrophic demand collapse and customer churn, destroying product visibility."
                elif pct_change > 30:
                    verdict = "🔴 RISKY DECISION"
                    sales_impact = "-60%"
                    explanation = f"Increasing price by +{pct_change:.0f}% significantly risks losing the Buy Box to cheaper competitors."
                elif pct_change > 0:
                    verdict = "🟢 GOOD DECISION" if new_margin > old_margin else "🟡 NEUTRAL"
                    sales_impact = f"-{min(15, max(5, int(pct_change * 0.8)))}%"
                    explanation = "Moderate price adjustment protects margin while keeping sales volume within a sustainable range."
                else:
                    verdict = "🟢 GOOD DECISION" if new_margin >= 20 else "🟡 NEUTRAL"
                    sales_impact = f"+{min(35, max(10, int(abs(pct_change) * 1.5)))}%"
                    explanation = "Competitive discount will stimulate sales velocity while preserving gross profitability."

                prod_title = matched_prod.get("name", extracted_prod) if matched_prod else extracted_prod
                fallback_resp = (
                    f"📊 **What-If Analysis: {prod_title}**\n"
                    f"- **Current Price:** ₹{current_p:,.2f} → **New Price:** ₹{new_p:,.2f}\n"
                    f"- **Cost (COGS):** ₹{base_c:,.2f}\n"
                    f"- **Current Margin:** {old_margin:.1f}% → **New Margin:** {new_margin:.1f}%\n"
                    f"- **Estimated Sales Impact:** {sales_impact}\n"
                    f"- **Overall Verdict:** {verdict}\n\n"
                    f"{explanation}\n\n"
                    f"---ACTION_REDIRECT_WHAT_IF---\n"
                    f"{json.dumps({'action': 'redirect_what_if', 'productQuery': extracted_prod, 'priceChange': str(int(new_p))})}"
                )
                return fallback_resp
            except Exception as fb_err:
                print(f"Fallback what-if calculation error: {fb_err}")

        if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
            return "⚠️ **AI Quota Reached:** The AI model is temporarily rate-limited. Please retry in 30 seconds."

        return "Oops! I encountered an error while processing your request. Please try again in a moment."
