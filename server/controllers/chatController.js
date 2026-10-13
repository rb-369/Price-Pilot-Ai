const Chat = require('../models/Chat');
const Product = require('../models/Product');
const Alert = require('../models/Alert');
const axios = require('axios');

const AI_URL = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');

exports.getChats = async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.user._id })
            .select('title updatedAt createdAt')
            .sort({ updatedAt: -1 });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getChat = async (req, res) => {
    try {
        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createChat = async (req, res) => {
    try {
        const { messages, title } = req.body;
        const newChat = await Chat.create({
            userId: req.user._id,
            title: title || 'New Chat',
            messages: messages || []
        });
        res.status(201).json(newChat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteChat = async (req, res) => {
    try {
        const chat = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const GEMINI_MODELS = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-flash-latest'
];

/**
 * Direct Gemini REST fallback when Python microservice is cold-starting or unreachable.
 */
async function tryDirectGemini(aiMessages, contextContent) {
    const rawKeys = [
        process.env.LLM_API_KEY,
        process.env.GEMINI_API_KEY,
        process.env.CHATBOT_API_KEY,
    ].filter(Boolean).map(k => k.trim());

    // Prefer keys that start with the standard Google AI key prefix (AIzaSy)
    const apiKey = rawKeys.find(k => k.startsWith('AIzaSy')) ||
                   rawKeys.find(k => !k.startsWith('sk-or-') && !k.startsWith('AQ.'));

    if (!apiKey) return null;

    const systemPrompt = `You are PricePilot AI Copilot, an intelligent assistant for e-commerce and retail merchants.
Key platform capabilities and knowledge:
1. Dynamic Pricing: Optimizing selling prices in INR (₹) while protecting gross margin floor.
2. Competitor Tracking: Live pricing intelligence across Amazon, Flipkart, Shopify.
3. Inventory Forecasting: Predicting stockouts 30-60 days ahead using Prophet and Holt-Winters.
4. Onboarding & Offline Sellers: If a seller asks how to add products, does not sell online yet, or has offline/physical retail sales, explain that PricePilot AI supports them completely! Marketplace URLs are optional. They can add products manually via "+ Add Product" or upload a CSV, track offline sales and stock, and simulate price changes.
5. Markdown Links: When helpful, recommend specific dashboard pages using markdown links:
   - [Products Catalog](/dashboard/products)
   - [What-If Simulator](/dashboard/simulator)
   - [Competitor Analysis](/dashboard/competitors)
   - [Inventory Forecasts](/dashboard/forecasts)
   - [AI Recommendations](/dashboard/recommendations)
   - [Sales & Analytics](/dashboard/analytics)
   - [Integrations](/dashboard/integrations)

Store Context:
- Catalog Products: ${contextContent?.products?.length || 0}
- Active Alerts: ${contextContent?.alerts?.length || 0}
- Currency: ${contextContent?.storeCurrency || 'INR (₹)'}
${(contextContent?.products || []).slice(0, 5).map(p => `- ${p.name}: ₹${p.priceNumeric} (Cost: ₹${p.baseCost}, Stock: ${p.stockLevel})`).join('\n')}

Respond clearly, concisely, and supportively. Format key steps with numbered lists or bullet points.`;

    const contents = [];
    for (const msg of aiMessages) {
        if (!msg.content) continue;
        const role = msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user';
        contents.push({
            role,
            parts: [{ text: String(msg.content) }]
        });
    }

    if (contents.length === 0) return null;

    for (const model of GEMINI_MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const res = await axios.post(url, {
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: contents.slice(-10),
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 1024,
                }
            }, { timeout: 15000 });

            const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim()) {
                return text.trim();
            }
        } catch (err) {
            console.warn(`[chatController] Direct Gemini (${model}) failed:`, err.response?.data?.error?.message || err.message);
            // Google Gemini tracks free quota per-model; continue to try alternative models
            continue;
        }
    }
    return null;
}

/**
 * Intelligent deterministic fallback when both Python microservice and direct LLM calls are unavailable.
 */
function generateSmartFallbackReply(userMsgText, products = [], alerts = []) {
    const raw = (userMsgText || '').toLowerCase().trim();
    const productCount = products.length;
    const alertCount = alerts.length;

    // 0. Grill-Me Strategy Session & Pricing Strategy Consultations
    const isGrillMe =
        /(?:grill[- ]?me|pricing strategy|pricing approach|price strategy|pricing model|what strategy|which strategy|strategy for|best strategy)/i.test(raw);

    if (isGrillMe) {
        let targetProduct = null;
        let productName = '';

        const taggedMatch = (userMsgText || '').match(/@"?([^"\n\r?]+)"?/);
        if (taggedMatch) {
            productName = taggedMatch[1].trim();
        } else {
            const forMatch = (userMsgText || '').match(/(?:for|on|about)\s+([A-Za-z0-9\s&+\-.]+?)(?:\?|$|\n|,\s*which|\s+to|\s+at)/i);
            if (forMatch) {
                productName = forMatch[1].replace(/^(?:the|my|a)\s+/i, '').trim();
            }
        }

        if (products && products.length > 0) {
            if (productName) {
                targetProduct = products.find(p => p.name && p.name.toLowerCase().includes(productName.toLowerCase())) || null;
            }
            if (!targetProduct && !productName && products.length === 1) {
                targetProduct = products[0];
                productName = targetProduct.name;
            }
        }

        const displayName = targetProduct?.name || productName || 'Your Catalog Products';
        const currentPr = targetProduct?.currentPrice || targetProduct?.priceNumeric ? `₹${targetProduct.currentPrice || targetProduct.priceNumeric}` : 'Market Parity';
        const costPr = targetProduct?.baseCost ? `₹${targetProduct.baseCost}` : 'Estimated COGS';
        const marginStr = targetProduct?.marginPercent ? `${targetProduct.marginPercent}%` : '40–50%';
        const stockStr = targetProduct?.stockLevel != null ? `${targetProduct.stockLevel} units` : 'Active Inventory';

        return (
            `### 🥊 PricePilot AI Grill-Me Session: Dynamic Pricing Strategy\n\n` +
            `**Target SKU:** **${displayName}**\n` +
            (targetProduct ? `• **Current Metrics:** Price: ${currentPr} | Cost: ${costPr} | Margin: ${marginStr} | Stock: ${stockStr}\n\n` : `\n`) +
            `#### 🏛️ 1. Executive Strategy Verdict: Value-Based Skimming & Margin Defense\n` +
            `In e-commerce marketplaces (Amazon, Flipkart, D2C), **under-pricing is a fatal trap**. ` +
            `Dropping price to chase volume in competitive categories destroys the 40–50% gross margin required to fund Amazon Sponsored Products (PPC) and absorb marketplace commissions (~15% referral fee + closing fees + FBA pick & pack). ` +
            `Instead, use **Value-Based Margin Defense with Tiered Bundles**.\n\n` +
            `#### 🎯 2. The 3-Pillar Execution Blueprint\n` +
            `1. **Protect the Margin Floor:** Never drop below a 35% net margin floor. If raw material or marketplace fees rise, let competitors engage in a margin-killing price war while you capture high-intent brand buyers.\n` +
            `2. **Virtual Bundling over Direct Discounting:** Rather than cutting single-unit price by 15%, sell a Duo-Pack or cross-sell with a complementary item (e.g., moisturizer + cleanser). This lifts Average Order Value (AOV) and lowers per-unit shipping overhead.\n` +
            `3. **Elasticity-Gated Surge Pricing:** When direct rivals go out of stock or experience logistics delays, leverage PricePilot to automatically raise price by 3–6% to capture surge profit.\n\n` +
            `#### ❓ 3 Questions to Grill Your Current Setup\n` +
            `1. **What is your true Net Landed Margin after Amazon Fees?**\n` +
            `   *If your gross margin is below 40%, Amazon PPC ad spend (15–25% ACOS) will turn this item into an unprofitable cash drain.*\n` +
            `2. **What is your Buy Box win rate against category benchmarks?**\n` +
            `   *Are you losing sales due to price, or due to slower fulfillment (Non-Prime vs Prime) or review count? Price cannot compensate for social proof.*\n` +
            `3. **Can your inventory sustain a promotional spike?**\n` +
            `   *If a discount triples sales velocity, do you have enough stock runway in [Inventory Forecasts](/dashboard/forecasts) to avoid stockout ranking penalties?*\n\n` +
            `#### 🚀 Next Actions in PricePilot AI\n` +
            `• Run margin simulations in the [What-If Simulator](/dashboard/simulator) before touching live prices.\n` +
            `• Track competing brand price spreads in [Competitor Analysis](/dashboard/competitors).\n` +
            `• Review AI-optimized price adjustments in [AI Recommendations](/dashboard/recommendations).`
        );
    }

    // 0.1 Plain English explanation
    if (/explain[- ]simply/i.test(raw)) {
        return (
            `### 💡 Plain-English Summary for Sellers\n\n` +
            `1. **Profit Impact:** Pricing optimization isn't about selling for the cheapest price; it's about making the most total profit in INR (₹) after all product costs, shipping, and marketplace fees.\n` +
            `2. **Action to Take:** Check your [AI Recommendations](/dashboard/recommendations) to see which items have high profit potential, and use the [What-If Simulator](/dashboard/simulator) to test new prices before publishing them live.`
        );
    }

    // 1. Onboarding, adding products, offline/physical retail sales
    const isAddingOrOffline =
        /(?:how (?:to|do i|can i) add|add (?:my )?product|add (?:my )?sales|offline|physical (?:store|shop|sales)|retail (?:store|shop|sales)|not (?:selling )?online|don'?t sell (?:it )?online|have sales|in-store|pos|getting started|new seller|upload (?:csv|catalog)|import (?:products|catalog|csv)|how (?:does|do) (?:this|pricepilot|it) work)/i.test(raw);

    if (isAddingOrOffline) {
        return (
            `### You can use PricePilot AI for both offline and online sales!\n\n` +
            `You do **not** need an active online store (Amazon, Flipkart, or Shopify) to use PricePilot AI. Here is how to add your products and sales:\n\n` +
            `1. **Add Your Products to the Catalog**\n` +
            `   • Go to [Products Catalog](/dashboard/products) and click the **"+ Add Product"** button.\n` +
            `   • Fill in your **Product Name**, **Category**, **Cost Price (Base Cost)**, **Selling Price**, and **Current Stock**.\n` +
            `   • *Marketplace URLs (Amazon/Flipkart) are completely optional* — leave them empty for offline items.\n` +
            `   • If you already have an inventory spreadsheet, use the **"Import CSV"** button to upload your entire catalog at once.\n\n` +
            `2. **Record Your In-Store & Offline Sales**\n` +
            `   • As items sell in your store, keep your stock levels updated in [Products Catalog](/dashboard/products).\n` +
            `   • You can track revenue trends and sales volume under [Sales & Analytics](/dashboard/analytics).\n\n` +
            `3. **Optimize Prices & Stock with AI**\n` +
            `   • Test pricing strategies and protect your profit margin with the [What-If Simulator](/dashboard/simulator).\n` +
            `   • Predict restock dates and avoid stockouts using [Inventory Forecasts](/dashboard/forecasts).\n` +
            `   • Check AI pricing health recommendations in [AI Recommendations](/dashboard/recommendations).\n\n` +
            `4. **Connect Online Marketplaces Anytime**\n` +
            `   • If you ever decide to expand to Shopify, Amazon, or Flipkart in the future, connect them under [Integrations](/dashboard/integrations).`
        );
    }

    // 2. Explicit request to VIEW, LIST, or SHOW the product catalog / counts
    const isCountQuery =
        /(?:how many (?:products|items|skus|goods)|(?:product|item|sku)\s+count|total (?:number of )?(?:products|items|skus)|number of (?:products|items|skus))/i.test(raw);

    const isExplicitCatalogQuery =
        isCountQuery ||
        /^(?:products|catalog|inventory|items|skus|\/products)$/i.test(raw) ||
        /(?:(?:show|list|view|what are|display|see|check|give me)\s+(?:all\s+|my\s+)?(?:products|catalog|inventory|items|skus))/i.test(raw);

    if (isExplicitCatalogQuery) {
        const sampleProds = products.slice(0, 5).map(p => {
            const rawPr = p.currentPrice || p.priceNumeric || 0;
            const formattedPrice = String(rawPr).startsWith('₹') ? rawPr : `₹${rawPr}`;
            return `• **${p.name}** (Current: ${formattedPrice}, Stock: ${p.stockLevel || 0})`;
        }).join('\n');
        return (
            `You currently have **${productCount} active products** in your catalog, with **${alertCount} active alerts**.\n\n` +
            `**Catalog Highlights:**\n${sampleProds}\n\n` +
            `To view full details, add new items, or edit pricing, visit your [Products Catalog](/dashboard/products) or run a demand simulation in [Inventory Forecasts](/dashboard/forecasts).`
        );
    }

    // 3. What-If scenario / price simulation
    if (/(?:what[- ]?if|simulate|simulation|elasticity|test price|change price)/i.test(raw)) {
        return (
            `### PricePilot AI What-If Scenario Simulator\n\n` +
            `You can simulate how price adjustments affect your sales volume and profit margins before making changes live.\n\n` +
            `• **How to run a simulation:** Open the [What-If Simulator](/dashboard/simulator) and select any product.\n` +
            `• **Tip:** You can also ask me directly in chat using \`/what-if\`, for example:\n` +
            `  \`/what-if I increase the price of DELL Laptop by 10%\`\n\n` +
            `The AI calculates estimated elasticity, margin percentage changes, and provides a clear risk verdict.`
        );
    }

    // 4. Competitor tracking
    if (/(?:competitor|market price|benchmark|marketplace tracking|amazon price|flipkart price)/i.test(raw)) {
        return (
            `### Live Competitor Intelligence\n\n` +
            `PricePilot AI tracks competitor prices across Amazon and Flipkart to ensure your products stay competitive while protecting your margin floor.\n\n` +
            `• View tracked competitor price spreads in [Competitor Analysis](/dashboard/competitors).\n` +
            `• You can add competitor URLs directly on each product's page in the [Products Catalog](/dashboard/products).`
        );
    }

    // 5. Demand & Stockout Forecasting
    if (/(?:forecast|demand|stockout|restock|reorder|run out|inventory health)/i.test(raw)) {
        return (
            `### AI Demand & Stockout Forecasting\n\n` +
            `Our forecasting engine uses Prophet and Holt-Winters time-series algorithms to predict 30-day demand trajectories and stockout dates.\n\n` +
            `• View inventory runout risks and reorder suggestions in [Inventory Forecasts](/dashboard/forecasts).\n` +
            `• Products nearing low-stock thresholds generate automated alerts shown on your [Dashboard](/dashboard).`
        );
    }

    // 6. Platform features / Help / About
    if (/(?:feature|capabilities|what can you do|about pricepilot|who are you|help|overview)/i.test(raw)) {
        return (
            `**PricePilot AI** is an intelligent e-commerce and retail pricing optimization copilot.\n\n` +
            `### Core Capabilities:\n` +
            `- **Dynamic Pricing Engine:** AI-driven price recommendations that protect gross margins while maximizing competitive revenue.\n` +
            `- **Competitor Tracking:** Live marketplace price monitoring with automated own-brand exclusion.\n` +
            `- **Demand & Stockout Forecasting:** 30–60 day inventory trajectory modeling via Prophet and Holt-Winters.\n` +
            `- **A/B Price Testing:** Conversion and revenue-per-visitor experiments with statistical significance validation.\n` +
            `- **What-If Scenario Simulator:** Real-time simulations for margin risk and sales velocity prior to committing price changes.\n` +
            `- **Multi-Channel Sync:** Seamless catalog & inventory mapping for Shopify, Amazon SP-API, and Flipkart.\n\n` +
            `Explore your store's live data in [AI Recommendations](/dashboard/recommendations) or [Products Catalog](/dashboard/products).`
        );
    }

    // 6.5 Specific product inquiry by name
    if (products && products.length > 0) {
        for (const p of products) {
            if (p.name && raw.includes(p.name.toLowerCase())) {
                const pr = p.currentPrice || p.priceNumeric || 0;
                const formattedPrice = String(pr).startsWith('₹') ? pr : `₹${pr}`;
                const cost = p.baseCost != null ? `₹${p.baseCost}` : 'N/A';
                const margin = p.marginPercent != null ? `${p.marginPercent}%` : 'N/A';
                return (
                    `### 📦 Product Details: ${p.name}\n\n` +
                    `• **Selling Price:** ${formattedPrice}\n` +
                    `• **Base Cost (COGS):** ${cost}\n` +
                    `• **Gross Margin:** ${margin}\n` +
                    `• **Stock Level:** ${p.stockLevel || 0} units\n` +
                    `• **Sales Velocity:** ${p.salesVelocity?.currentHourlySalesRate || p.salesVelocity || 0} units/hr\n\n` +
                    `To simulate price adjustments, ask \`/what-if @"${p.name}" to [new price]\` or edit SKU parameters in your [Products Catalog](/dashboard/products).`
                );
            }
        }
    }

    // 7. General fallback
    return (
        `PricePilot AI Copilot is active for your store (**${productCount} catalog products**, **${alertCount} active alerts**).\n\n` +
        `Here are some quick things you can do:\n` +
        `• **Add products or sales:** Manage offline or online items in [Products Catalog](/dashboard/products).\n` +
        `• **Simulate pricing:** Test margin changes in the [What-If Simulator](/dashboard/simulator).\n` +
        `• **Check inventory forecasts:** View stockout timelines in [Inventory Forecasts](/dashboard/forecasts).\n` +
        `• **Review recommendations:** View pricing opportunities in [AI Recommendations](/dashboard/recommendations).`
    );
}

exports.sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, contextText } = req.body; // New user message and optional extracted text from PDF
        
        let chat = await Chat.findOne({ _id: id, userId: req.user._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        // Generate title if it's the first message and title is default
        if (chat.messages.length === 0 && chat.title === 'New Chat') {
            chat.title = (message || '').substring(0, 30) + ((message || '').length > 30 ? '...' : '');
        }

        const userMsg = { role: 'user', content: message || '' };
        chat.messages.push(userMsg);

        // Gather real context for the chatbot (RAG)
        let products = await Product.find({ userId: req.user._id }).limit(20);
        
        // Fallback: If user has no custom products associated, fetch general products
        if (!products || products.length === 0) {
            products = await Product.find({}).limit(20);
        }

        // If message contains a tagged product like @"Product Name" or @ProductName, explicitly search & append it
        const tagMatch = (message || '').match(/@"?([^"\n\r?]+)"?/);
        if (tagMatch && tagMatch[1]) {
            const taggedName = tagMatch[1].trim();
            const specificProduct = await Product.findOne({
                name: { $regex: taggedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
            });
            if (specificProduct && !products.some(p => String(p._id) === String(specificProduct._id))) {
                products.unshift(specificProduct);
            }
        }

        const alerts = await Alert.find({ userId: req.user._id, status: 'active' }).limit(10);
        
        // Prepare context
        let contextContent = {
            userId: req.user._id,
            storeCurrency: "INR (₹)",
            currencySymbol: "₹",
            products: products.map(p => {
                const currentPrice = Number(p.currentPrice) || 100;
                const baseCost = (typeof p.baseCost === 'number' && !isNaN(p.baseCost) && p.baseCost > 0)
                    ? p.baseCost
                    : Math.round(currentPrice * 0.6);
                const marginPct = currentPrice > 0
                    ? (((currentPrice - baseCost) / currentPrice) * 100).toFixed(1) + '%'
                    : '40.0%';
                const salesRate = p.salesVelocity?.avgHourlySalesRate || 0;

                return { 
                    name: p.name, 
                    sku: p.sku || 'N/A',
                    category: p.category || 'General',
                    currentPrice: `₹${currentPrice}`, 
                    priceNumeric: currentPrice,
                    baseCost: baseCost,
                    baseCostFormatted: `₹${baseCost}`,
                    marginPercent: marginPct,
                    minMargin: p.minMargin || 0.1,
                    currency: "INR (₹)", 
                    stockLevel: p.stockLevel || 0,
                    salesVelocity: salesRate,
                    peakSalesRate: p.salesVelocity?.peakHourlySalesRate || 0,
                };
            }),
            alerts: alerts.map(a => ({ type: a.type, title: a.title, message: a.message }))
        };

        // If user attached a PDF/document, add it to the messages being sent to AI
        let aiMessages = [...chat.messages];
        if (contextText) {
            aiMessages.push({ role: 'user', content: `Additionally, the user has attached a document with the following content. Please answer their query based on this if relevant:\n\n${contextText}` });
        }

        const payload = {
            messages: aiMessages,
            context: contextContent
        };

        let replyText;
        try {
            const aiResponse = await axios.post(`${AI_URL}/api/chat`, payload, { timeout: 35000 });
            replyText = aiResponse.data.reply || aiResponse.data;
        } catch (aiErr) {
            console.error('Python AI Service unreachable/failed in chatController:', aiErr.message);
            // 1. Try direct Gemini call if API key is present
            try {
                replyText = await tryDirectGemini(aiMessages, contextContent);
            } catch (geminiErr) {
                console.warn('Direct Gemini call failed in sendMessage fallback:', geminiErr.message);
            }

            // 2. If direct Gemini did not return a response, use deterministic intelligent fallback
            if (!replyText) {
                const userMsgText = aiMessages[aiMessages.length - 1]?.content || '';
                replyText = generateSmartFallbackReply(userMsgText, products, alerts);
            }
        }

        // 3. If Python returned a generic rate-limit/quota message, check if smart fallback can answer cleanly
        if (typeof replyText === 'string' && (replyText.includes('AI Quota Reached') || replyText.includes('rate-limited') || replyText.includes('quota'))) {
            const userMsgText = aiMessages[aiMessages.length - 1]?.content || '';
            const smartFallback = generateSmartFallbackReply(userMsgText, products, alerts);
            if (smartFallback) {
                replyText = smartFallback;
            }
        }

        const modelMsg = { role: 'model', content: typeof replyText === 'string' ? replyText : JSON.stringify(replyText) };
        chat.messages.push(modelMsg);
        await chat.save();

        res.json({ chat, reply: modelMsg });
    } catch (error) {
        console.error('Chat error:', error.message);
        if (error.response) {
            console.error('AI Service Error Data:', error.response.data);
        }
        res.status(500).json({ 
            message: 'Failed to communicate with AI Chatbot', 
            error: error.message,
            details: error.response?.data || null
        });
    }
};

function checkQueryRelevance(promptText) {
    if (!promptText) return true;
    const lower = promptText.toLowerCase();

    // Explicit off-topic indicators (travel, recipes, sports, entertainment trivia)
    const offTopicKeywords = [
        'trip', 'vacation', 'holiday', 'hotel', 'flight', 'resort', 'beach', 'destination', 'tourist', 'itinerary',
        'recipe', 'cook', 'baking', 'ingredients', 'dinner', 'restaurant',
        'sports', 'football', 'cricket', 'nfl', 'nba', 'soccer', 'match score',
        'movie', 'cinema', 'actor', 'actress', 'song', 'music', 'album',
        'joke', 'riddle', 'poem', 'capital of', 'who is the president', 'weather today'
    ];

    // Relevant domain keywords (e-commerce, pricing, inventory, catalog, marketing, business)
    const domainKeywords = [
        'price', 'pricing', 'cost', 'margin', 'discount', 'competitor', 'product', 'item', 'inventory', 'stock',
        'stockout', 'demand', 'sales', 'forecast', 'trend', 'elasticity', 'channel', 'shopify', 'amazon', 'flipkart',
        'sku', 'revenue', 'profit', 'alert', 'catalog', 'method', 'strategy', 'market', 'unit', 'sell', 'buy',
        'store', 'order', 'customer', 'reconciliation', 'ab-test', 'experiment', 'tier', 'fee', 'shipping',
        'fulfillment', 'analyze', 'recommend', 'bottle', 'steel'
    ];

    const hasOffTopicKeyword = offTopicKeywords.some(kw => lower.includes(kw));
    const hasDomainKeyword = domainKeywords.some(kw => lower.includes(kw));

    if (hasOffTopicKeyword && !hasDomainKeyword) {
        return false; // Explicitly off-topic query
    }
    return true;
}

exports.submitFeedback = async (req, res) => {
    try {
        const { id, messageIndex } = req.params;
        const { rating, comment, category } = req.body;

        const chat = await Chat.findOne({ _id: id, userId: req.user._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        const index = parseInt(messageIndex, 10);
        if (isNaN(index) || index < 0 || index >= chat.messages.length) {
            return res.status(400).json({ message: 'Invalid message index' });
        }

        const msg = chat.messages[index];
        
        // Find preceding user prompt to assess domain relevance
        let userPromptText = '';
        for (let i = index - 1; i >= 0; i--) {
            if (chat.messages[i].role === 'user') {
                userPromptText = chat.messages[i].content;
                break;
            }
        }

        const isRelevant = checkQueryRelevance(userPromptText);
        const feedbackStatus = isRelevant ? 'accepted' : 'ignored_offtopic';

        msg.feedback = {
            rating: rating || null,
            comment: comment || '',
            category: category || '',
            status: feedbackStatus,
            timestamp: new Date()
        };

        await chat.save();

        res.json({
            success: true,
            status: feedbackStatus,
            accepted: isRelevant,
            message: isRelevant 
                ? 'Thank you for your feedback! It has been recorded to improve PricePilot AI.' 
                : 'Feedback received. Note: Off-topic query feedback (unrelated to e-commerce or pricing) is filtered out from model training datasets.',
            feedback: msg.feedback,
            chat
        });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
    }
};

exports.editMessage = async (req, res) => {
    try {
        const { id, messageIndex } = req.params;
        const { message, contextText } = req.body;

        let chat = await Chat.findOne({ _id: id, userId: req.user._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        const index = parseInt(messageIndex, 10);
        if (isNaN(index) || index < 0 || index >= chat.messages.length) {
            return res.status(400).json({ message: 'Invalid message index' });
        }

        // Truncate messages after index and update user prompt
        chat.messages = chat.messages.slice(0, index);
        chat.messages.push({ role: 'user', content: message || '' });

        // Gather RAG context
        const products = await Product.find({ userId: req.user._id }).limit(20);
        const alerts = await Alert.find({ userId: req.user._id, status: 'active' }).limit(10);
        
        let contextContent = {
            userId: req.user._id,
            storeCurrency: "INR (₹)",
            currencySymbol: "₹",
            products: products.map(p => ({ 
                name: p.name, 
                currentPrice: `₹${p.currentPrice}`, 
                priceNumeric: p.currentPrice,
                currency: "INR (₹)", 
                stockLevel: p.stockLevel 
            })),
            alerts: alerts.map(a => ({ type: a.type, title: a.title, message: a.message }))
        };

        let aiMessages = [...chat.messages];
        if (contextText) {
            aiMessages.push({ role: 'user', content: `Additionally, the user has attached a document with the following content. Please answer their query based on this if relevant:\n\n${contextText}` });
        }

        let replyText;
        try {
            const aiResponse = await axios.post(`${AI_URL}/api/chat`, {
                messages: aiMessages,
                context: contextContent
            }, { timeout: 35000 });
            replyText = aiResponse.data.reply || aiResponse.data;
        } catch (aiErr) {
            console.error('Python AI Service unreachable in editMessage:', aiErr.message);
            try {
                replyText = await tryDirectGemini(aiMessages, contextContent);
            } catch (geminiErr) {
                console.warn('Direct Gemini call failed in editMessage fallback:', geminiErr.message);
            }

            if (!replyText) {
                const userMsgText = aiMessages[aiMessages.length - 1]?.content || '';
                replyText = generateSmartFallbackReply(userMsgText, products, alerts);
            }
        }

        // 3. If Python returned a generic rate-limit/quota message, check if smart fallback can answer cleanly
        if (typeof replyText === 'string' && (replyText.includes('AI Quota Reached') || replyText.includes('rate-limited') || replyText.includes('quota'))) {
            const userMsgText = aiMessages[aiMessages.length - 1]?.content || '';
            const smartFallback = generateSmartFallbackReply(userMsgText, products, alerts);
            if (smartFallback) {
                replyText = smartFallback;
            }
        }

        const modelMsg = { role: 'model', content: typeof replyText === 'string' ? replyText : JSON.stringify(replyText) };
        chat.messages.push(modelMsg);
        await chat.save();

        res.json({ chat, reply: modelMsg });
    } catch (error) {
        console.error('Edit message error:', error);
        res.status(500).json({ message: 'Failed to edit message', error: error.message });
    }
};
