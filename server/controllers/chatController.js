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
        const products = await Product.find({ userId: req.user._id }).limit(20);
        const alerts = await Alert.find({ userId: req.user._id, status: 'active' }).limit(10);
        
        // Prepare context
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
            const aiResponse = await axios.post(`${AI_URL}/api/chat`, payload);
            replyText = aiResponse.data.reply || aiResponse.data;
        } catch (aiErr) {
            console.error('Python AI Service unreachable/failed in chatController:', aiErr.message);
            replyText = "Oops! I'm currently operating in fallback mode because the Python AI microservice is unreachable (it may be sleeping on Render). Please check the AI_SERVICE_URL configuration or wake up the service.";
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
            });
            replyText = aiResponse.data.reply || aiResponse.data;
        } catch (aiErr) {
            console.error('Python AI Service unreachable in editMessage:', aiErr.message);
            replyText = "Oops! I'm currently operating in fallback mode because the Python AI microservice is unreachable.";
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
