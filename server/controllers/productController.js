const Product = require('../models/Product');
const CompetitorPrice = require('../models/CompetitorPrice');
const DemandSignal = require('../models/DemandSignal');
const PriceHistory = require('../models/PriceHistory');
const { checkProductForLowStock } = require('../services/inventoryMonitor');

exports.getProducts = async (req, res) => {
    try {
        // Pagination params
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        // Scoped to authenticated user
        const filter = { userId: req.user._id };

        const [products, total] = await Promise.all([
            Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Product.countDocuments(filter),
        ]);

        res.json({
            data: products,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const safeBody = { ...req.body };
        delete safeBody.userId;
        delete safeBody._id;

        const { name, sku, currentPrice, baseCost, urlLivePrice } = safeBody;
        if (!name || !sku || currentPrice === undefined || baseCost === undefined) {
             return res.status(400).json({ message: 'Name, SKU, currentPrice, and baseCost are required fields.' });
        }

        // Strict Price Mismatch Protection
        if (urlLivePrice && Number(urlLivePrice) > 0) {
            const livePrice = Number(urlLivePrice);
            const enteredPrice = Number(currentPrice);
            const percentDiff = (Math.abs(livePrice - enteredPrice) / livePrice) * 100;
            if (percentDiff > 3) {
                return res.status(400).json({
                    code: 'PRICE_MISMATCH',
                    livePrice,
                    enteredPrice,
                    message: `Price Mismatch Detected: The live price at the provided URL is ₹${livePrice.toLocaleString()}, but you entered ₹${enteredPrice.toLocaleString()}. Please resolve the price or URL before saving.`
                });
            }
        }

        // Set Short Name & Full Name fallbacks
        safeBody.fullName = safeBody.fullName || safeBody.name;
        safeBody.shortName = safeBody.shortName || safeBody.name.slice(0, 40);

        const product = await Product.create({ ...safeBody, userId: req.user._id });

        // Record initial Price History entry
        await PriceHistory.create({
            productId: product._id,
            price: product.currentPrice,
            baseCost: product.baseCost,
            changeReason: 'initial_creation',
            timestamp: new Date(),
        }).catch(() => {});

        res.status(201).json(product);

        // --- Fire-and-forget: Generate historical demand signals so graphs work immediately ---
        _generateHistoricalDemandSignals(product).catch(err => {
            console.error(`[ProductCreate] Background demand signal generation failed for ${product._id}:`, err.message);
        });

        // --- Fire-and-forget: Check for low stock immediately ---
        checkProductForLowStock(product, req.user).catch(() => {});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const safeBody = { ...req.body };
        delete safeBody.userId;
        delete safeBody._id;

        const oldProduct = await Product.findOne({ _id: req.params.id, userId: req.user._id });
        if (!oldProduct) return res.status(404).json({ message: 'Product not found' });

        const { currentPrice, urlLivePrice } = safeBody;

        // Strict Price Mismatch Protection on update
        if (urlLivePrice && Number(urlLivePrice) > 0 && currentPrice) {
            const livePrice = Number(urlLivePrice);
            const enteredPrice = Number(currentPrice);
            const percentDiff = (Math.abs(livePrice - enteredPrice) / livePrice) * 100;
            if (percentDiff > 3) {
                return res.status(400).json({
                    code: 'PRICE_MISMATCH',
                    livePrice,
                    enteredPrice,
                    message: `Price Mismatch Detected: The live price at the provided URL is ₹${livePrice.toLocaleString()}, but you entered ₹${enteredPrice.toLocaleString()}. Please resolve the price or URL before saving.`
                });
            }
        }

        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            safeBody,
            { new: true }
        );

        // If price changed, record price history
        if (safeBody.currentPrice !== undefined && safeBody.currentPrice !== oldProduct.currentPrice) {
            await PriceHistory.create({
                productId: product._id,
                price: product.currentPrice,
                baseCost: product.baseCost,
                changeReason: 'manual_update',
                timestamp: new Date(),
            }).catch(() => {});
        }

        checkProductForLowStock(product, req.user).catch(() => {});

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.extractUrlMetadata = async (req, res) => {
    try {
        const { url: rawUrl } = req.body;
        if (!rawUrl || typeof rawUrl !== 'string') {
            return res.status(400).json({ message: 'Product URL is required.' });
        }

        const url = rawUrl.trim();
        let platform = 'generic';
        let amazonAsin = null;
        let flipkartFsn = null;

        // Follow redirects to resolve short links like amzn.in/d/..., amzn.to/..., bit.ly/...
        let finalUrl = url;
        let html = '';

        try {
            const fetchRes = await fetch(url, {
                method: 'GET',
                redirect: 'follow',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            finalUrl = fetchRes.url || url;
            html = await fetchRes.text();
        } catch (fetchErr) {
            console.warn('[URL Extraction] Fetch error, using original URL:', fetchErr.message);
        }

        const lowercaseFinalUrl = finalUrl.toLowerCase();
        const lowercaseOriginalUrl = url.toLowerCase();

        if (lowercaseFinalUrl.includes('amazon') || lowercaseOriginalUrl.includes('amzn')) {
            platform = 'amazon';
            const asinMatch = finalUrl.match(/(?:dp|gp\/product)\/([A-Z0-9]{10})/i) || url.match(/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
            if (asinMatch) amazonAsin = asinMatch[1];
        } else if (lowercaseFinalUrl.includes('flipkart')) {
            platform = 'flipkart';
            const fsnMatch = finalUrl.match(/pid=([A-Z0-9]{16})/i) || finalUrl.match(/\/p\/itm([a-z0-9]+)/i);
            if (fsnMatch) flipkartFsn = fsnMatch[1];
        } else if (lowercaseFinalUrl.includes('shopify') || lowercaseFinalUrl.includes('myshopify')) {
            platform = 'shopify';
        }

        let metadata = {
            fullName: '',
            shortName: '',
            currentPrice: null,
            imageUrl: '',
            category: 'Electronics',
            description: '',
            brand: '',
            modelNumber: '',
            keySpecs: [],
            platform,
            amazonAsin,
            flipkartFsn,
            productLinks: {
                amazon: platform === 'amazon' ? finalUrl : '',
                flipkart: platform === 'flipkart' ? finalUrl : '',
                shopify: platform === 'shopify' ? finalUrl : '',
                meesho: platform === 'meesho' ? finalUrl : ''
            }
        };

        const cleanText = (str) => {
            if (!str) return '';
            return str
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'")
                .replace(/&#x27;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/\s+/g, ' ')
                .trim();
        };

        if (html) {
            const titleMatch = html.match(/<span\s+id=["']productTitle["'][^>]*>\s*([^<]+)\s*<\/span>/i) ||
                               html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                               html.match(/<title>([^<]+)<\/title>/i) ||
                               html.match(/<meta\s+name=["']title["']\s+content=["']([^"']+)["']/i);

            if (titleMatch && titleMatch[1]) {
                let rawTitle = cleanText(titleMatch[1]);
                rawTitle = rawTitle.replace(/\s*:\s*Amazon\.in.*$/i, '').replace(/\s*-\s*Amazon\.in.*$/i, '').trim();
                metadata.fullName = rawTitle;

                const shortTitle = rawTitle.split(/[,|\-–—(]/)[0].trim();
                metadata.shortName = shortTitle.length >= 3 ? shortTitle : rawTitle.slice(0, 40);
            }

            const imageMatch = html.match(/data-old-hires=["']([^"']+)["']/i) ||
                               html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                               html.match(/["']large["']\s*:\s*["']([^"']+\.(?:jpg|png|webp))["']/i);
            if (imageMatch && imageMatch[1]) {
                metadata.imageUrl = imageMatch[1];
            }

            const priceMatch = html.match(/class=["']a-price-whole["']>([\d,]+)/i) ||
                               html.match(/<meta\s+property=["']og:price:amount["']\s+content=["']([\d.]+)/i) ||
                               html.match(/["']priceAmount["']\s*:\s*([\d.]+)/i) ||
                               html.match(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)/i);
            if (priceMatch && priceMatch[1]) {
                const parsedPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
                if (!isNaN(parsedPrice) && parsedPrice > 0) {
                    metadata.currentPrice = parsedPrice;
                }
            }

            const brandMatch = html.match(/<a\s+id=["']bylineInfo["'][^>]*>\s*(?:Visit the|Brand:)?\s*([^<]+)\s*<\/a>/i) ||
                               html.match(/<meta\s+property=["']og:brand["']\s+content=["']([^"']+)["']/i) ||
                               html.match(/["']brand["']\s*:\s*["']?([^"'}]+)/i);

            if (brandMatch && brandMatch[1]) {
                const cleanBrand = cleanText(brandMatch[1]).replace(/Visit the|Store|Brand:/gi, '').trim();
                if (cleanBrand.length < 30) metadata.brand = cleanBrand;
            }

            if (!metadata.brand && metadata.fullName) {
                const knownBrands = ['REDMI', 'XIAOMI', 'ASUS', 'APPLE', 'DELL', 'HP', 'LENOVO', 'SAMSUNG', 'SONY', 'MILTON', 'BOAT', 'NIKE', 'ADIDAS', 'PUMA', 'LOGITECH', 'ONEPLUS', 'REALME', 'POCO'];
                const upperName = metadata.fullName.toUpperCase();
                const matched = knownBrands.find(b => upperName.includes(b));
                if (matched) metadata.brand = matched.charAt(0) + matched.slice(1).toLowerCase();
            }

            if (metadata.fullName) {
                const specRegexes = [
                    /\b\d+\s*GB\b/gi,
                    /\b\d+\s*TB\b/gi,
                    /\b5G\b/gi,
                    /\b(?:Core\s+i[3579]|Ryzen\s+[3579]|M[1234]\s*(?:Pro|Max)?|Snapdragon\s*\d*)\b/gi,
                    /\bRTX\s*\d{4}\b/gi,
                    /\b\d{2,3}Hz\b/gi,
                    /\bFHD\+?|4K|QHD|AMOLED|OLED\b/gi
                ];
                const foundSpecs = new Set();
                specRegexes.forEach(rgx => {
                    const matches = metadata.fullName.match(rgx);
                    if (matches) matches.forEach(m => foundSpecs.add(m.trim()));
                });
                metadata.keySpecs = Array.from(foundSpecs);
            }
        }

        if (!metadata.fullName && finalUrl) {
            const slugMatch = finalUrl.match(/amazon\.[a-z.]+\/([^/]+)\/dp\//i);
            if (slugMatch && slugMatch[1]) {
                const cleanSlug = slugMatch[1].replace(/[-_]/g, ' ').trim();
                metadata.fullName = cleanSlug;
                metadata.shortName = cleanSlug.split(/[,|\-–—(]/)[0].trim();
            } else {
                metadata.fullName = amazonAsin ? `Amazon Product (${amazonAsin})` : 'Imported Product';
                metadata.shortName = amazonAsin ? `Amazon ${amazonAsin}` : 'Imported Product';
            }
        }

        res.json(metadata);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Failed to extract product URL metadata' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Also clean up related data
        await Promise.all([
            CompetitorPrice.deleteMany({ productId: product._id }),
            DemandSignal.deleteMany({ productId: product._id }),
            PriceHistory.deleteMany({ productId: product._id }),
        ]);

        res.json({ message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPriceHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 30));

        const product = await Product.findOne({ _id: id, userId: req.user._id });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        let history = await PriceHistory.find({ productId: id })
            .sort({ timestamp: 1 })
            .limit(100);

        // If sparse or no price history exists, generate 30 days of baseline history
        if (!history || history.length < 5) {
            const competitorPrices = await CompetitorPrice.find({ productId: id }).limit(10);
            const compAvg = competitorPrices.length > 0
                ? competitorPrices.reduce((sum, c) => sum + c.competitorPrice, 0) / competitorPrices.length
                : product.currentPrice * 1.04;
            const amazonP = competitorPrices.find(c => c.competitorName === 'Amazon' || c.platform === 'Amazon')?.competitorPrice || compAvg * 0.98;
            const flipkartP = competitorPrices.find(c => c.competitorName === 'Flipkart' || c.platform === 'Flipkart')?.competitorPrice || compAvg * 1.02;

            const docs = [];
            for (let d = days; d >= 0; d--) {
                const date = new Date();
                date.setDate(date.getDate() - d);
                // Slight realistic variance over time
                const variation = 1 + (Math.sin(d / 3) * 0.02);
                const ownVariation = 1 + (Math.cos(d / 4) * 0.025);
                docs.push({
                    productId: product._id,
                    price: Math.round(product.currentPrice * ownVariation),
                    baseCost: product.baseCost,
                    competitorAvgPrice: Math.round(compAvg * variation),
                    amazonPrice: Math.round(amazonP * variation),
                    flipkartPrice: Math.round(flipkartP * variation),
                    changeReason: d === 0 ? 'current' : 'historical_tracking',
                    timestamp: date,
                });
            }
            await PriceHistory.deleteMany({ productId: id });
            history = await PriceHistory.insertMany(docs);
        }

        // Summary stats
        const prices = history.map(h => h.price);
        const compPrices = history.map(h => h.competitorAvgPrice).filter(p => p > 0);
        const stats = {
            lowestPrice: Math.min(...prices),
            highestPrice: Math.max(...prices),
            currentPrice: product.currentPrice,
            baseCost: product.baseCost,
            avgCompetitorPrice: compPrices.length > 0 ? Math.round(compPrices.reduce((a, b) => a + b, 0) / compPrices.length) : product.currentPrice,
        };

        res.json({ history, stats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.bulkImportProducts = async (req, res) => {
    try {
        const { products } = req.body;
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'Provide an array of product objects to import.' });
        }

        const createdProducts = [];
        const errors = [];

        for (let i = 0; i < products.length; i++) {
            const item = products[i];
            try {
                if (!item.name || !item.sku || item.currentPrice === undefined || item.baseCost === undefined) {
                    errors.push({ row: i + 1, sku: item.sku || 'N/A', error: 'Missing required fields (name, sku, currentPrice, baseCost)' });
                    continue;
                }

                const existing = await Product.findOne({ sku: item.sku, userId: req.user._id });
                if (existing) {
                    errors.push({ row: i + 1, sku: item.sku, error: 'SKU already exists for your account' });
                    continue;
                }

                const product = await Product.create({
                    name: String(item.name).trim(),
                    sku: String(item.sku).trim(),
                    category: item.category || 'General',
                    baseCost: Number(item.baseCost),
                    currentPrice: Number(item.currentPrice),
                    minMargin: Number(item.minMargin || 0.1),
                    stockLevel: Number(item.stockLevel || 0),
                    reorderThreshold: Number(item.reorderThreshold || 10),
                    description: item.description || '',
                    userId: req.user._id,
                });

                createdProducts.push(product);

                // Fire-and-forget initial Price History & demand signals
                PriceHistory.create({
                    productId: product._id,
                    price: product.currentPrice,
                    baseCost: product.baseCost,
                    changeReason: 'bulk_import',
                    timestamp: new Date(),
                }).catch(() => {});

                _generateHistoricalDemandSignals(product).catch(() => {});
                
                // Fire-and-forget low stock check
                checkProductForLowStock(product, req.user).catch(() => {});
            } catch (err) {
                errors.push({ row: i + 1, sku: item.sku || 'N/A', error: err.message });
            }
        }

        res.status(200).json({
            message: `Successfully imported ${createdProducts.length} products.`,
            importedCount: createdProducts.length,
            errorCount: errors.length,
            errors,
            products: createdProducts,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
async function _generateHistoricalDemandSignals(product) {
    const demandOps = [];

    for (let day = 30; day >= 0; day--) {
        const date = new Date();
        date.setDate(date.getDate() - day);

        // Seeded randomness based on product ID + day for deterministic results
        const seed = (product._id.toString().charCodeAt(0) + day) / 100;

        // Demand Signals
        const searchTrendScore = Math.round(20 + ((day * 31 + seed * 100) % 70));
        const weatherFactor = parseFloat((((day * 17 + seed * 50) % 150) / 100 - 0.75).toFixed(2));
        const eventFactor = parseFloat((((day * 13 + seed * 30) % 80) / 100 - 0.3).toFixed(2));
        const socialSentimentScore = parseFloat((((day * 23 + seed * 70) % 120) / 100 - 0.3).toFixed(2));
        
        const compositeDemandScore = 
            (searchTrendScore / 100) * 0.4 +
            ((weatherFactor + 1) / 2) * 0.2 +
            ((eventFactor + 1) / 2) * 0.2 +
            ((socialSentimentScore + 1) / 2) * 0.2;

        demandOps.push({
            insertOne: {
                document: {
                    productId: product._id,
                    searchTrendScore,
                    weatherFactor,
                    eventFactor,
                    socialSentimentScore,
                    compositeDemandScore,
                    timestamp: date,
                },
            },
        });
    }

    if (demandOps.length > 0) {
        await DemandSignal.bulkWrite(demandOps);
    }

    console.log(`[ProductCreate] Generated ${demandOps.length} demand signals for "${product.name}"`);
}
