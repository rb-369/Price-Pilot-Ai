"""
Conversational AI Chatbot Service
Uses LangChain RAG with ChromaDB, Gemini as primary LLM, and OpenRouter as fallback.
"""
import os
import re
import json
import asyncio
import hashlib
from typing import List, Dict, Optional, Any

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langgraph.prebuilt import create_react_agent

from services.vector_store import get_retriever, ingest_data

SYSTEM_PROMPT = """You are PricePilot AI, the built-in intelligent copilot for the PricePilot AI e-commerce pricing and inventory intelligence platform.
You are an expert on both the merchant's live inventory/catalog and all features, tools, algorithms, and workflows across the entire PricePilot AI platform.
Answer the user's questions clearly, concisely, authoritatively, and professionally.

=======================================================
PRICEPILOT AI PLATFORM KNOWLEDGE BASE & FEATURE GUIDE:
=======================================================

1. DASHBOARD (/dashboard):
   - Executive command center summarizing real-time store performance.
   - Key Performance Indicators (KPIs): Total Catalog Value, Average Gross Margin %, Active Price Recommendations, Stockout Risk Count, Active Critical Alerts.
   - Quick Action Cards: Jump to pending recommendations, launch A/B split tests, view high-risk stock items.
   - Recent Activity Feed & Real-time Alerts ticker.

2. ANALYTICS (/dashboard/analytics):
   - Deep-dive profit and revenue analytics.
   - Metrics: Gross Profit Margin distribution, revenue growth trajectories, category performance breakdown, sales velocity trends, price elasticity curves.
   - Pre-post impact analysis showing how accepted AI price recommendations performed versus previous baseline prices.

3. PRODUCTS (/dashboard/products):
   - Central product catalog management.
   - Fields: SKU, Product Name, Brand, Category, Current Selling Price, Base Cost (COGS), Margin %, Current Stock Level, Reorder Threshold, Minimum Margin Guardrail (minMargin).
   - "AI Competitor Matching Precision Gauge": Dynamically rates match accuracy. Adding Amazon/Flipkart product URLs, brand names, or tech specs boosts precision up to 98%.
   - Catalog Tools: CSV bulk catalog import, CSV export, inline product editing, stock adjustments, and instant "Ask Copilot" contextual prompts per item.

4. COMPETITORS (/dashboard/competitors):
   - Real-time rival intelligence and price tracking.
   - Data Ingestion: Automated live scraping of Amazon (via Rainforest API / SerpApi) and Flipkart, plus manual competitor URL/ASIN matching.
   - Guardrails: Strictly excludes the merchant's own brand products (so you never benchmark against yourself) and enforces category relevance (e.g. cookware never compares against smartphones).
   - Metrics: Competitor price, in-stock/stockout status, platform badges, competitor price variance vs your store, and market price ceilings.

5. DEMAND SIGNALS (/dashboard/demand):
   - Multi-source external market demand aggregation.
   - Signals Ingested:
     * Google Trends search intensity score (0-100).
     * Social media sentiment polarity (positive, neutral, negative).
     * Regional weather impact factor (temperature/precipitation shifts affecting purchasing).
     * Seasonal, festival, and holiday multiplier factors.
   - "Composite Demand Score": A normalized score (0.0 to 1.0) combining all factors to feed the pricing and forecasting engines.

6. INVENTORY FORECASTS (/dashboard/forecasts):
   - AI-driven demand forecasting and stock replenishment planning.
   - Core Forecasting Engines:
     * Primary: Facebook Prophet (multi-trend decomposition, weekly and yearly seasonality, holiday calendar shifts).
     * Fallback: Holt-Winters exponential smoothing from statsmodels.
     * Last-resort fallback: Moving average trend extrapolation.
   - Outputs: 30-day predicted unit demand, days until stock depletion, recommended stock reorder quantity, stock coverage vs demand gauge, confidence score, and explainable rationale.
   - Export: 1-click CSV download of stock forecasts.

7. AI PRICING RECOMMENDATIONS (/dashboard/recommendations):
   - Explainable dynamic pricing recommendations.
   - Core Formulation: Solves for maximum per-unit gross profit: (Price - Base Cost) * Volume, rather than just top-line revenue.
   - Bayesian Elasticity & Competitor Benchmarking: Adjusts price based on live competitor prices, price elasticity of demand, and demand signals.
   - Margin Guardrails: Strictly enforces `minMargin` (e.g., minimum 10-15% profit above COGS) so prices never drop below sustainable floor costs.
   - Gemini XAI Rationale: Provides plain-English summary, risk assessment (Low, Medium, High Risk), detailed financial analysis, and concrete action items.
   - Actions: 1-click "Accept Price" (updates live price), "Reject", "Revert" (restores previous price), or "Run A/B Test".

8. A/B TEST EXPERIMENTS (/dashboard/ab-tests):
   - Live pricing split-testing engine.
   - Workflow: Merchants can launch an A/B test directly from any recommendation to compare Variant A (Current Price) vs Variant B (AI Recommended Price).
   - Tracking: Monitors conversion rate, total visitors, total revenue, revenue per visitor (RPV), statistical significance (z-score, p-value), and automated winning price promotion.

9. WHAT-IF PRICING SIMULATOR (/what-if <product> to <price>):
   - Interactive conversational scenario testing tool.
   - Merchants can simulate any hypothetical price adjustment (e.g., `/what-if @"Premium Steel Bottle" to ₹750` or "What happens if I increase the price of the frying pan to ₹550?").
   - Calculates new gross profit margin %, price change %, expected sales volume delta based on price elasticity, Buy Box risk, and generates an interactive redirect action card.

10. ALERTS CENTER (/dashboard/alerts):
    - Automated real-time notification hub.
    - Alert triggers:
      * Competitor price drop (>10% price undercut by rival).
      * Inventory depletion warning (stock level < reorder threshold).
      * Profit margin breach risk (cost increase or market price drop violating minMargin).
      * Unusual demand surge detected.
    - Delivery: In-app notification center + instant email alerts via SendGrid / Brevo.

11. INTEGRATIONS (/dashboard/integrations):
    - Multi-platform e-commerce storefront connectors.
    - Supported platforms: Shopify, Amazon Seller Central, Flipkart Seller Hub, WooCommerce, and custom webhooks.
    - Enables automatic two-way catalog synchronization, inventory syncing, and automated live price publishing.

12. CHANNEL MAPPING (/dashboard/channel-mapping):
    - Multi-channel listing management.
    - Maps master product SKUs across multiple external sales channels with customized platform markups, commission offsets (e.g. covering Amazon 15% referral fee), and localized pricing rules.

13. PROFILE & SETTINGS (/dashboard/settings):
    - Store preferences, profile management, and notification toggles.
    - Store Currency Selection: Default INR (₹), with support for USD ($), EUR (€), GBP (£), AUD, CAD, and more.
    - Default Competitor Tracking Strategy: Options include "Win Buy Box & Track Rivals" (automated 1-2% discount below cheapest verified rival), "Protect Margin", or "Follow Market Average".
    - Email notifications configuration (SendGrid / Brevo API credentials).

14. DOCUMENT / PDF UPLOAD IN CHAT:
    - Merchants can upload PDFs, CSVs, or text files (e.g. supplier price sheets, competitor invoices, inventory exports) directly into the chat widget. PricePilot AI extracts text and analyzes pricing or catalog data.

15. EXPLAIN WITH AI & ASK COPILOT BUTTONS:
    - Contextual chips across Product cards, Recommendation cards, and Forecast cards. Clicking them instantly opens the copilot with pre-filled context for deep analysis.

=======================================================
CRITICAL OPERATING INSTRUCTIONS FOR THE CHATBOT:
=======================================================
1. FULL PLATFORM MASTERY: You are an expert on all features, navigation tabs, and algorithms in PricePilot AI. When asked about any feature, tab, calculation, how-to guide, workflow, or integration, give a thorough, step-by-step, helpful answer. NEVER say "I don't have that information" when asked about how PricePilot AI works or what features it has!
2. DATA ACCURACY: Only use "I don't have that information" if the user asks for specific private data (such as a specific order ID or a specific product not found in their catalog context). For all general app questions, you have complete knowledge.
3. CURRENCY & PRICING: The merchant's default store currency is INR (₹). Always quote catalog prices and competitor prices in INR (₹). Do NOT default to USD ($) unless explicitly asked.
4. BE SPECIFIC & ANALYTICAL: Quote exact numbers, margins, and percentages from the context when discussing catalog products.
5. PRODUCT MATCHING: When a user mentions a product (e.g., @"Product Name"), locate it in the context by name to pull its exact currentPrice, baseCost, marginPercent, stockLevel, and salesVelocity.
6. WHAT-IF SCENARIOS: When a user asks a What-If question, calculate the margin change and sales volume impact using economic elasticity, and follow the special What-If format with the redirect payload.
7. TONE: Professional, analytical, proactive, and concise. Format responses with clean Markdown, bold headers, and bullet points.

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

async def _call_openrouter_direct(
    openrouter_key: str,
    system_prompt: str,
    messages: List[Dict],
    latest_query: str
) -> Optional[str]:
    """
    Direct asynchronous HTTP call to OpenRouter with robust fallback models.
    Bypasses LangGraph and tool-binding restrictions for zero-failure resilient completion.
    """
    import httpx
    
    headers = {
        "Authorization": f"Bearer {openrouter_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://price-pilot-ai.vercel.app",
        "X-Title": "PricePilot AI"
    }

    formatted_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        role = "assistant" if msg.get("role") in ["model", "assistant"] else "user"
        content_val = msg.get("content", "")
        if content_val:
            formatted_messages.append({"role": role, "content": str(content_val)})

    models_to_try = [
        "poolside/laguna-s-2.1:free",
        "nvidia/nemotron-3.5-lightning:free",
        "google/gemma-4-31b-it:free",
        "liquid/lfm-2.5-2.6b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "poolside/laguna-xs-2.1:free",
        "openrouter/free"
    ]

    async with httpx.AsyncClient(timeout=35.0) as client:
        for model in models_to_try:
            try:
                payload = {
                    "model": model,
                    "messages": formatted_messages,
                    "temperature": 0.4,
                }
                res = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        reply = choices[0]["message"].get("content", "").strip()
                        if reply:
                            print(f"[Chatbot] Successfully routed and answered via OpenRouter model: {model}")
                            return reply
                else:
                    print(f"[Chatbot] OpenRouter model '{model}' responded with HTTP {res.status_code}: {res.text[:150]}")
            except Exception as req_err:
                print(f"[Chatbot] OpenRouter model '{model}' connection error: {req_err}")
                continue

    return None


def _generate_catalog_fallback_reply(latest_query: str, context_data: Optional[Dict]) -> Optional[str]:
    """
    Deterministic intelligent responder for catalog, inventory, and store operations
    when external cloud LLMs (Gemini / OpenRouter) hit temporary rate limits or quota ceilings.
    """
    if not latest_query:
        return None

    raw = latest_query.lower().strip()
    ctx = context_data if isinstance(context_data, dict) else {}
    products = ctx.get("products", [])
    alerts = ctx.get("alerts", [])
    total_prods = ctx.get("totalProducts", len(products))

    # 0. Grill-Me Strategy Session & Pricing Strategy Consultations
    is_grill_me = bool(re.search(r'\b(?:grill[- ]?me|pricing strategy|pricing approach|price strategy|pricing model|what strategy|which strategy|strategy for|best strategy)\b', raw))
    if is_grill_me:
        target_product = None
        product_name = ""

        tagged_match = re.search(r'@"?([^"\n\r?]+)"?', latest_query)
        if tagged_match:
            product_name = tagged_match.group(1).strip()
        else:
            for_match = re.search(r'(?:for|on|about)\s+([A-Za-z0-9\s&+\-.]+?)(?:\?|$|\n|,\s*which|\s+to|\s+at)', latest_query, re.IGNORECASE)
            if for_match:
                product_name = re.sub(r'^(?:the|my|a)\s+', '', for_match.group(1).strip(), flags=re.IGNORECASE)

        if products:
            if product_name:
                target_product = next((p for p in products if p.get("name") and product_name.lower() in p.get("name", "").lower()), None)
            if not target_product and not product_name and len(products) == 1:
                target_product = products[0]
                product_name = target_product.get("name", "")

        display_name = (target_product.get("name") if target_product else None) or product_name or "Your Catalog Products"
        current_pr = target_product.get("currentPrice", f"₹{target_product.get('priceNumeric', 0)}") if target_product else "Market Parity"
        cost_pr = target_product.get("baseCost", "Estimated COGS") if target_product else "Estimated COGS"
        margin_str = f"{target_product.get('marginPercent')}%" if target_product and target_product.get("marginPercent") else "40–50%"
        stock_str = f"{target_product.get('stockLevel')} units" if target_product and target_product.get("stockLevel") is not None else "Active Inventory"

        metrics_line = f"• **Current Metrics:** Price: {current_pr} | Cost: {cost_pr} | Margin: {margin_str} | Stock: {stock_str}\n\n" if target_product else "\n"

        return (
            f"### 🥊 PricePilot AI Grill-Me Session: Dynamic Pricing Strategy\n\n"
            f"**Target SKU:** **{display_name}**\n"
            f"{metrics_line}"
            f"#### 🏛️ 1. Executive Strategy Verdict: Value-Based Skimming & Margin Defense\n"
            f"In e-commerce marketplaces (Amazon, Flipkart, D2C), **under-pricing is a fatal trap**. "
            f"Dropping price to chase volume in competitive categories destroys the 40–50% gross margin required to fund Amazon Sponsored Products (PPC) and absorb marketplace commissions (~15% referral fee + closing fees + FBA pick & pack). "
            f"Instead, use **Value-Based Margin Defense with Tiered Bundles**.\n\n"
            f"#### 🎯 2. The 3-Pillar Execution Blueprint\n"
            f"1. **Protect the Margin Floor:** Never drop below a 35% net margin floor. If raw material or marketplace fees rise, let competitors engage in a margin-killing price war while you capture high-intent brand buyers.\n"
            f"2. **Virtual Bundling over Direct Discounting:** Rather than cutting single-unit price by 15%, sell a Duo-Pack or cross-sell with a complementary item (e.g., moisturizer + cleanser). This lifts Average Order Value (AOV) and lowers per-unit shipping overhead.\n"
            f"3. **Elasticity-Gated Surge Pricing:** When direct rivals go out of stock or experience logistics delays, leverage PricePilot to automatically raise price by 3–6% to capture surge profit.\n\n"
            f"#### ❓ 3 Questions to Grill Your Current Setup\n"
            f"1. **What is your true Net Landed Margin after Amazon Fees?**\n"
            f"   *If your gross margin is below 40%, Amazon PPC ad spend (15–25% ACOS) will turn this item into an unprofitable cash drain.*\n"
            f"2. **What is your Buy Box win rate against category benchmarks?**\n"
            f"   *Are you losing sales due to price, or due to slower fulfillment (Non-Prime vs Prime) or review count? Price cannot compensate for social proof.*\n"
            f"3. **Can your inventory sustain a promotional spike?**\n"
            f"   *If a discount triples sales velocity, do you have enough stock runway in [Inventory Forecasts](/dashboard/forecasts) to avoid stockout ranking penalties?*\n\n"
            f"#### 🚀 Next Actions in PricePilot AI\n"
            f"• Run margin simulations in the [What-If Simulator](/dashboard/simulator) before touching live prices.\n"
            f"• Track competing brand price spreads in [Competitor Analysis](/dashboard/competitors).\n"
            f"• Review AI-optimized price adjustments in [AI Recommendations](/dashboard/recommendations)."
        )

    # 0.1 Plain English explanation
    if bool(re.search(r'\b(?:explain[- ]simply)\b', raw)):
        return (
            "### 💡 Plain-English Summary for Sellers\n\n"
            "1. **Profit Impact:** Pricing optimization isn't about selling for the cheapest price; it's about making the most total profit in INR (₹) after all product costs, shipping, and marketplace fees.\n"
            "2. **Action to Take:** Check your [AI Recommendations](/dashboard/recommendations) to see which items have high profit potential, and use the [What-If Simulator](/dashboard/simulator) to test new prices before publishing them live."
        )

    # 1. Product Count / Number of products (e.g. "so how many products do i have?", "total products")
    is_count_query = (
        bool(re.search(r'\bhow many (?:products|items|skus|goods)\b', raw)) or
        bool(re.search(r'\b(?:product|item|sku)\s+count\b', raw)) or
        bool(re.search(r'\btotal (?:number of )?(?:products|items|skus)\b', raw)) or
        bool(re.search(r'\bnumber of (?:products|items|skus)\b', raw))
    )
    if is_count_query:
        if total_prods == 0:
            return (
                "You currently have **0 products** in your catalog.\n\n"
                "To get started, navigate to [Products Catalog](/dashboard/products) and click **'+ Add Product'** "
                "or import your catalog using **'Import CSV'**."
            )
        lines = []
        for p in products[:6]:
            p_name = p.get("name", "Product")
            p_price = p.get("currentPrice", f"₹{p.get('priceNumeric', 0)}")
            p_stock = p.get("stockLevel", 0)
            p_margin = p.get("marginPercent", "N/A")
            lines.append(f"• **{p_name}** — Price: {p_price} | Stock: {p_stock} units | Margin: {p_margin}")
        
        extra = f"\n*...and {total_prods - len(lines)} more products.*" if total_prods > len(lines) else ""
        alert_str = f"\n\n🔔 You also have **{len(alerts)} active alerts** requiring your attention in the [Alerts Center](/dashboard/alerts)." if alerts else ""
        return (
            f"You currently have **{total_prods} active products** in your catalog.\n\n"
            f"**Catalog Highlights:**\n"
            + "\n".join(lines)
            + extra
            + alert_str
            + "\n\nYou can review complete inventory details or adjust pricing in your [Products Catalog](/dashboard/products)."
        )

    # 2. View / List Catalog & Inventory (e.g. "what products do i have?", "show catalog", "list products")
    is_catalog_list_query = (
        bool(re.search(r'\b(?:what|show|list|view|display|check|see)\s+(?:all\s+|my\s+)?(?:products|catalog|inventory|items|skus)\b', raw)) or
        raw in ["products", "catalog", "inventory", "my products", "/products"]
    )
    if is_catalog_list_query:
        if total_prods == 0:
            return (
                "Your catalog is currently empty (0 products).\n\n"
                "Add your first product in [Products Catalog](/dashboard/products) or upload an inventory spreadsheet via **Import CSV**."
            )
        lines = []
        for p in products[:8]:
            p_name = p.get("name", "Product")
            p_price = p.get("currentPrice", f"₹{p.get('priceNumeric', 0)}")
            p_stock = p.get("stockLevel", 0)
            p_cost = p.get("baseCost", "N/A")
            p_margin = p.get("marginPercent", "N/A")
            lines.append(f"• **{p_name}** — Selling: {p_price} | Cost: {p_cost} | Margin: {p_margin} | Stock: {p_stock}")
        extra = f"\n*...plus {total_prods - len(lines)} additional products.*" if total_prods > len(lines) else ""
        return (
            f"### Store Catalog Overview ({total_prods} products)\n\n"
            + "\n".join(lines)
            + extra
            + "\n\nVisit [Products Catalog](/dashboard/products) to edit SKUs, costs, or sync live marketplace pricing."
        )

    # 3. Low stock / stockout queries
    is_stock_query = bool(re.search(r'\b(?:low stock|out of stock|stockout|reorder|restock|depleted|low on stock)\b', raw))
    if is_stock_query:
        low_stock_items = [p for p in products if isinstance(p.get("stockLevel"), (int, float)) and p.get("stockLevel") <= 15]
        if not low_stock_items:
            return (
                f"✅ **Healthy Inventory:** None of your {total_prods} products are currently critically low on stock!\n\n"
                "You can inspect 30-day demand trajectories and forecasted depletion dates under [Inventory Forecasts](/dashboard/forecasts)."
            )
        lines = [f"• **{p.get('name')}**: Only **{p.get('stockLevel', 0)} units** remaining (Selling at {p.get('currentPrice')})" for p in low_stock_items[:6]]
        return (
            f"⚠️ **Low Stock Alert:** The following {len(low_stock_items)} product(s) are running low:\n\n"
            + "\n".join(lines)
            + "\n\nHead over to [Inventory Forecasts](/dashboard/forecasts) to view automated reorder suggestions and projected stockout dates."
        )

    # 4. Alerts inquiry
    is_alert_query = bool(re.search(r'\b(?:alerts?|notifications?|warnings?)\b', raw))
    if is_alert_query:
        if not alerts:
            return (
                "✅ You currently have **0 active alerts**. All pricing floors, competitor spreads, and stock levels are stable!\n\n"
                "Check the [Alerts Center](/dashboard/alerts) anytime to manage your notification thresholds."
            )
        lines = [f"• **[{a.get('type', 'Alert').upper()}] {a.get('title', 'Notice')}**: {a.get('message', '')}" for a in alerts[:5]]
        return (
            f"🔔 **Active Alerts ({len(alerts)}):**\n\n"
            + "\n".join(lines)
            + "\n\nReview or resolve these under the [Alerts Center](/dashboard/alerts)."
        )

    # 5. Matching a specific product by name
    for p in products:
        p_name = p.get("name", "")
        if p_name and p_name.lower() in raw:
            return (
                f"📦 **Product Details: {p_name}**\n"
                f"- **Selling Price:** {p.get('currentPrice', 'N/A')}\n"
                f"- **Cost Price (COGS):** {p.get('baseCost', 'N/A')}\n"
                f"- **Gross Margin:** {p.get('marginPercent', 'N/A')}\n"
                f"- **Stock Level:** {p.get('stockLevel', 0)} units\n"
                f"- **Sales Velocity:** {p.get('salesVelocity', 0)} units/hr\n\n"
                f"You can simulate a price change using `/what-if @\"{p_name}\" to [new price]` "
                f"or edit listing details in [Products Catalog](/dashboard/products)."
            )

    # 6. Onboarding / Offline sales
    is_adding_or_offline = bool(re.search(r'\b(?:how (?:to|do i|can i) add|add (?:my )?product|offline|physical (?:store|shop|sales)|retail|not (?:selling )?online|upload (?:csv|catalog)|import (?:products|catalog))\b', raw))
    if is_adding_or_offline:
        return (
            "### Managing Products & Offline Sales in PricePilot AI\n\n"
            "You can use PricePilot AI for both offline retail stores and online channels:\n\n"
            "1. **Add Items**: Go to [Products Catalog](/dashboard/products) and click **'+ Add Product'** or use **'Import CSV'**.\n"
            "2. **Marketplace Links**: Amazon and Flipkart URLs are completely optional. Offline stores can leave them blank.\n"
            "3. **Track & Optimize**: Keep inventory updated to run AI restock predictions in [Inventory Forecasts](/dashboard/forecasts) and test margins in the [What-If Simulator](/dashboard/simulator)."
        )

    # 7. Fallback when AI rate-limited: provide graceful store summary instead of dead-end 429
    if products or alerts:
        lines = [f"• **{p.get('name')}** ({p.get('currentPrice', '₹0')}, Stock: {p.get('stockLevel', 0)})" for p in products[:4]]
        return (
            "⚠️ **Live Store Mode (Cloud AI Rate-Limited):**\n\n"
            f"External AI models have temporarily reached their free-tier quota ceiling. While they refresh, here is your store snapshot:\n\n"
            f"- **Total Products in Catalog:** {total_prods}\n"
            f"- **Active Alerts:** {len(alerts)}\n\n"
            "**Catalog Highlights:**\n"
            + "\n".join(lines) + "\n\n"
            "You can ask me questions about your **products**, **stock counts**, **alerts**, or run pricing simulations using `/what-if`."
        )

    return None


async def chat_with_ai(messages: List[Dict], context_data: Dict = None) -> str:
    """
    Main entry point for Chatbot with RAG & Agentic Tool Invocation.
    """
    # Initialize ephemeral Working Memory for this session
    memory = WorkingMemory(messages, context_data)
    latest_query = memory.get_latest_query()

    context_str = await memory.build_context_string(latest_query)
    # Collect all available Gemini keys (prioritizing standard AIzaSy keys)
    raw_gemini_keys = [
        os.getenv("LLM_API_KEY", "").strip(),
        os.getenv("GEMINI_API_KEY", "").strip(),
        os.getenv("CHATBOT_API_KEY", "").strip(),
    ]
    valid_gemini_keys = [k for k in raw_gemini_keys if k and not k.startswith("sk-or-") and not k.startswith("AQ.")]
    valid_gemini_keys = list(dict.fromkeys(valid_gemini_keys))
    valid_gemini_keys.sort(key=lambda k: 0 if k.startswith("AIzaSy") else 1)

    openrouter_key = (
        os.getenv("OPENROUTER_API_KEY", "").strip() or 
        os.getenv("OPEN_ROUTER_API_KEY", "").strip()
    )
    if not openrouter_key:
        for k in raw_gemini_keys:
            if k.startswith("sk-or-"):
                openrouter_key = k
                break

    try:
        candidate_llms = []
        for g_key in valid_gemini_keys:
            for m_name in [
                "gemini-2.0-flash",
                "gemini-2.5-flash",
                "gemini-1.5-flash",
                "gemini-1.5-flash-8b",
                "gemini-flash-latest",
            ]:
                candidate_llms.append(
                    ChatGoogleGenerativeAI(
                        model=m_name,
                        google_api_key=g_key,
                        max_retries=1,
                    )
                )

        if openrouter_key:
            for openrouter_model in [
                "poolside/laguna-s-2.1:free",
                "nvidia/nemotron-3.5-lightning:free",
                "google/gemma-4-31b-it:free",
                "liquid/lfm-2.5-2.6b:free",
                "nvidia/nemotron-3-super-120b-a12b:free",
                "poolside/laguna-xs-2.1:free",
                "openrouter/free"
            ]:
                candidate_llms.append(
                    ChatOpenAI(
                        model=openrouter_model,
                        base_url="https://openrouter.ai/api/v1",
                        api_key=openrouter_key,
                        max_retries=1,
                    )
                )

        if not candidate_llms:
            # Check deterministic fallback if no keys configured
            cat_reply = _generate_catalog_fallback_reply(latest_query, context_data)
            if cat_reply:
                return cat_reply
            return "Oops! No AI keys are configured for the chatbot. Please add CHATBOT_API_KEY or OPENROUTER_API_KEY to your environment variables."

        primary_llm = candidate_llms[0]
        fallbacks = candidate_llms[1:]
        if fallbacks:
            llm = primary_llm.with_fallbacks(fallbacks)
        else:
            llm = primary_llm
        
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

        # Special handling for slash commands: /explain-simply, /what-if, /grill-me
        latest_lower = latest_query.lower().strip()
        is_explain_simply = 'explain-simply' in latest_lower
        is_what_if = 'what-if' in latest_lower or 'whatif' in latest_lower
        is_grill_me = 'grill-me' in latest_lower or 'grill me' in latest_lower or 'pricing strategy' in latest_lower

        command_instructions = ""
        if is_explain_simply:
            command_instructions = (
                "\n\nSPECIAL INSTRUCTION FOR /explain-simply:\n"
                "Explain the user's query in 2 plain-English bullet points for a normal seller with zero technical background.\n"
                "1. Focus on what this means for their net profit (in ₹ INR).\n"
                "2. Focus on what exact practical action the seller should take.\n"
                "DO NOT use jargon like elasticity, variance, regression, or logit."
            )
        elif is_grill_me:
            command_instructions = (
                "\n\nSPECIAL INSTRUCTION FOR /grill-me & PRICING STRATEGY:\n"
                "The user is requesting an adversarial, senior e-commerce pricing strategy consultation (Grill-Me session).\n"
                "1. Executive Verdict: Recommend Value-Based Margin Defense or Tiered Bundling. Strongly warn against reckless price wars that destroy gross margins required for Amazon PPC (Sponsored Products).\n"
                "2. Strategy Pillars: Define clear margin floor rules (min 35-45% net contribution), bundle recommendations, and elasticity surge triggers.\n"
                "3. Socratic Grilling: Pose 3 piercing questions about unit economics (COGS, referral fees ~15%, PPC ACOS, inventory runway).\n"
                "4. Actionable Next Steps: Reference PricePilot's What-If Simulator (/dashboard/simulator) and Competitor Intelligence (/dashboard/competitors).\n"
                "Tone: Senior e-commerce pricing partner, incisive, practical, profit-focused."
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

        # 1. Attempt direct fallback to OpenRouter models (bypassing LangGraph & tool-binding limitations)
        if openrouter_key:
            try:
                print(f"[Chatbot] Gemini/LangGraph failed ({e}). Attempting direct OpenRouter fallback...")
                or_response = await _call_openrouter_direct(
                    openrouter_key=openrouter_key,
                    system_prompt=full_system_prompt,
                    messages=messages,
                    latest_query=latest_query
                )
                if or_response and len(or_response.strip()) > 0:
                    if is_what_if and "---ACTION_REDIRECT_WHAT_IF---" not in or_response:
                        import re
                        import json
                        p_match = re.search(r'@"?([^"\n\r?]+)"?', latest_query) or re.search(r'(?:of|for)\s+([A-Za-z0-9\s]+?)\s+(?:to|by)', latest_query, re.IGNORECASE)
                        pr_match = re.search(r'(?:to|by)\s*(?:₹|rs\.?|inr)?\s*(\d+)', latest_query, re.IGNORECASE) or re.search(r'(\d+)\s*(?:rs|inr|₹)', latest_query, re.IGNORECASE)
                        extracted_prod = p_match.group(1).strip() if p_match else "Product"
                        extracted_price = pr_match.group(1).strip() if pr_match else ""
                        payload_json = json.dumps({"action": "redirect_what_if", "productQuery": extracted_prod, "priceChange": extracted_price})
                        or_response += f"\n\n---ACTION_REDIRECT_WHAT_IF---\n{payload_json}"

                    memory.save_episodic_interaction(latest_query, or_response)
                    return or_response
            except Exception as or_err:
                print(f"[Chatbot] Direct OpenRouter fallback also failed: {or_err}")
        else:
            print("[Chatbot] Cannot route to OpenRouter because OPENROUTER_API_KEY is not configured in environment variables.")

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

        # Check deterministic intelligent catalog fallback before returning generic rate-limit / quota error
        catalog_reply = _generate_catalog_fallback_reply(latest_query, context_data)
        if catalog_reply:
            memory.save_episodic_interaction(latest_query, catalog_reply)
            return catalog_reply

        if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
            return "⚠️ **AI Quota Reached:** The AI model is temporarily rate-limited. Please retry in 30 seconds."

        if "503" in err_str or "unavailable" in err_str or "high demand" in err_str:
            return "⏳ **High Demand:** The AI model is temporarily experiencing high traffic spikes. Please try again in a few moments."

        return "Oops! I encountered an error while processing your request. Please try again in a moment."
