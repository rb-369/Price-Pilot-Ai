import { useState, useEffect } from 'react';
import { getProducts, createProduct, deleteProduct, updateProduct, generateProductDescription, extractProductUrlMetadata } from '../api';
import { useCurrency } from '../context/CurrencyContext';
import toast from 'react-hot-toast';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineCube, 
  HiOutlineX, 
  HiOutlinePencil, 
  HiOutlineChartBar, 
  HiOutlineLightningBolt,
  HiOutlineLink,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineLightBulb,
  HiOutlineChip
} from 'react-icons/hi';
import AskAIButton from '../components/AskAIButton';
import { SkeletonTable } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import PriceHistoryModal from '../components/PriceHistoryModal';
import BulkImportModal from '../components/BulkImportModal';

const STANDARD_CATEGORIES = [
    "General", "Electronics", "Footwear", "Apparel", "Groceries", 
    "Fitness", "Beauty & Personal Care", "Home & Kitchen", 
    "Toys & Games", "Automotive", "Sports & Outdoors", 
    "Books & Media", "Health & Wellness", "Jewelry & Accessories"
];

const DEFAULT_FORM_STATE = { 
    name: '', shortName: '', fullName: '',
    brand: '', modelNumber: '', keySpecs: '',
    sku: '', category: 'General', 
    baseCost: '', currentPrice: '', minMargin: '10', 
    stockLevel: '', reorderThreshold: '10', safetyBuffer: '2',
    description: '',
    productLinks: { amazon: '', flipkart: '', meesho: '', shopify: '' }
};

export default function Products() {
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(DEFAULT_FORM_STATE);
    const [customCategory, setCustomCategory] = useState('');
    const [editId, setEditId] = useState(null);
    const { formatCurrency, config } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [historyProduct, setHistoryProduct] = useState(null);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // URL Importer & Mismatch States
    const [formMode, setFormMode] = useState('url'); // 'url' or 'manual'
    const [importUrl, setImportUrl] = useState('');
    const [extractingUrl, setExtractingUrl] = useState(false);
    const [urlLivePrice, setUrlLivePrice] = useState(null);
    const [livePlatform, setLivePlatform] = useState('');
    const [mismatchError, setMismatchError] = useState(null);
    const [overrideMismatch, setOverrideMismatch] = useState(false);
    const [verifyingPrice, setVerifyingPrice] = useState(false);

    const fetchProducts = () => {
        setLoading(true);
        setError(false);
        getProducts()
            .then(r => setProducts(r.data.data || r.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    const calculatePrecision = () => {
        let precision = 50;
        if (form.brand || form.modelNumber) precision += 15;
        if (form.keySpecs) precision += 10;
        if (form.productLinks?.amazon || form.productLinks?.flipkart || form.productLinks?.shopify) precision += 23;
        return Math.min(98, precision);
    };

    const handleExtractUrl = async () => {
        if (!importUrl) {
            toast.error('Please enter a product URL from Amazon, Flipkart, or Shopify');
            return;
        }
        setExtractingUrl(true);
        setOverrideMismatch(false);
        const toastId = toast.loading('Extracting product metadata & live price...');
        try {
            const res = await extractProductUrlMetadata(importUrl);
            const data = res.data;
            toast.success('Metadata extracted successfully!', { id: toastId });

            const isStandard = STANDARD_CATEGORIES.includes(data.category);

            setForm(prev => ({
                ...prev,
                name: data.shortName || data.fullName || prev.name,
                shortName: data.shortName || prev.shortName,
                fullName: data.fullName || prev.fullName,
                brand: data.brand || prev.brand,
                modelNumber: data.modelNumber || prev.modelNumber,
                keySpecs: Array.isArray(data.keySpecs) ? data.keySpecs.join(', ') : (data.keySpecs || prev.keySpecs),
                currentPrice: data.currentPrice ? String(data.currentPrice) : prev.currentPrice,
                category: isStandard ? data.category : 'General',
                description: data.description || prev.description,
                productLinks: {
                    ...prev.productLinks,
                    ...(data.productLinks || {}),
                    ...(data.platform && importUrl ? { [data.platform]: data.productLinks?.[data.platform] || importUrl } : {})
                }
            }));

            if (data.currentPrice) {
                setUrlLivePrice(data.currentPrice);
                setLivePlatform(data.platform || '');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to extract URL metadata', { id: toastId });
        } finally {
            setExtractingUrl(false);
        }
    };

    // Auto-fetch live price when any channel URL is entered or modified in manual/url mode
    useEffect(() => {
        const activeUrl = form.productLinks?.amazon || 
                         form.productLinks?.flipkart || 
                         form.productLinks?.shopify || 
                         importUrl;

        if (!activeUrl || !showForm) return;

        const timer = setTimeout(async () => {
            try {
                setVerifyingPrice(true);
                const res = await extractProductUrlMetadata(activeUrl);
                if (res.data?.currentPrice) {
                    setUrlLivePrice(res.data.currentPrice);
                    setLivePlatform(res.data.platform || '');
                }
            } catch (err) {
                // Silently ignore background real-time fetch errors
            } finally {
                setVerifyingPrice(false);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [form.productLinks?.amazon, form.productLinks?.flipkart, form.productLinks?.shopify, importUrl, showForm]);

    // Check for price mismatch whenever urlLivePrice or selling price changes
    useEffect(() => {
        if (urlLivePrice && form.currentPrice) {
            const live = Number(urlLivePrice);
            const entered = Number(form.currentPrice);
            if (live > 0 && entered > 0) {
                const percentDiff = (Math.abs(live - entered) / live) * 100;
                if (percentDiff > 3) {
                    const platformLabel = livePlatform ? (livePlatform.charAt(0).toUpperCase() + livePlatform.slice(1)) : 'Live Channel Link';
                    setMismatchError(`Price Mismatch Detected: Live price at ${platformLabel} is ${formatCurrency(live)}, but entered price is ${formatCurrency(entered)} (${percentDiff.toFixed(1)}% variance). Please reconcile before saving.`);
                } else {
                    setMismatchError(null);
                }
            } else {
                setMismatchError(null);
            }
        } else {
            setMismatchError(null);
        }
    }, [urlLivePrice, form.currentPrice, livePlatform, formatCurrency]);

    const handleGenerateAiCopy = async () => {
        if (!form.name && !form.fullName) {
            toast.error('Please enter a Product Name first');
            return;
        }
        setIsGenerating(true);
        const toastId = toast.loading('Generating AI description & SEO tags...');
        try {
            const finalCategory = form.category === 'Other' ? customCategory : form.category;
            const res = await generateProductDescription({ productName: form.fullName || form.name, category: finalCategory });
            toast.success('AI description generated!', { id: toastId });
            setForm(prev => ({
                ...prev,
                name: res.data.title || prev.name,
                description: res.data.description || prev.description
            }));
        } catch {
            toast.error('AI generation failed', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const openAddForm = () => {
        setForm(DEFAULT_FORM_STATE);
        setCustomCategory('');
        setImportUrl('');
        setUrlLivePrice(null);
        setLivePlatform('');
        setMismatchError(null);
        setOverrideMismatch(false);
        setFormMode('url');
        setEditId(null);
        setShowForm(!showForm);
    };

    const handleEditClick = (p) => {
        setEditId(p._id);
        const isStandard = STANDARD_CATEGORIES.includes(p.category);
        
        setForm({
            name: p.name || '',
            shortName: p.shortName || p.name || '',
            fullName: p.fullName || p.name || '',
            brand: p.brand || '',
            modelNumber: p.modelNumber || '',
            keySpecs: Array.isArray(p.keySpecs) ? p.keySpecs.join(', ') : (p.keySpecs || ''),
            sku: p.sku || '',
            category: isStandard ? p.category : 'Other',
            baseCost: p.baseCost || '',
            currentPrice: p.currentPrice || '',
            minMargin: p.minMargin ? (p.minMargin * 100).toString() : '10',
            stockLevel: p.stockLevel || '',
            reorderThreshold: p.reorderThreshold || '10',
            safetyBuffer: p.safetyBuffer !== undefined ? p.safetyBuffer.toString() : '2',
            description: p.description || '',
            productLinks: p.productLinks || { amazon: '', flipkart: '', meesho: '', shopify: '' }
        });
        
        if (!isStandard) {
            setCustomCategory(p.category);
        } else {
            setCustomCategory('');
        }
        
        setUrlLivePrice(null);
        setLivePlatform('');
        setMismatchError(null);
        setOverrideMismatch(false);
        setFormMode('manual');
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (mismatchError && !overrideMismatch) {
            toast.error('Please resolve the Price Mismatch or toggle "Use Custom Price" before submitting');
            return;
        }

        try {
            const finalCategory = form.category === 'Other' ? customCategory : form.category;
            const parsedSpecs = typeof form.keySpecs === 'string' 
                ? form.keySpecs.split(',').map(s => s.trim()).filter(Boolean)
                : form.keySpecs;

            const payload = { 
                ...form,
                name: form.shortName || form.name,
                shortName: form.shortName || form.name,
                fullName: form.fullName || form.name,
                keySpecs: parsedSpecs,
                category: finalCategory,
                baseCost: +form.baseCost, 
                currentPrice: +form.currentPrice, 
                minMargin: (+form.minMargin) / 100, 
                stockLevel: +form.stockLevel, 
                reorderThreshold: +form.reorderThreshold,
                safetyBuffer: +form.safetyBuffer || 2,
                urlLivePrice: urlLivePrice ? Number(urlLivePrice) : undefined
            };

            if (editId) {
                await updateProduct(editId, payload);
                toast.success('Product updated');
            } else {
                await createProduct(payload);
                toast.success('Product created');
            }

            setShowForm(false);
            setEditId(null);
            setForm(DEFAULT_FORM_STATE);
            setCustomCategory('');
            setImportUrl('');
            setUrlLivePrice(null);
            setMismatchError(null);
            fetchProducts();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this product?')) return;
        try {
            await deleteProduct(id);
            toast.success('Deleted');
            fetchProducts();
        } catch {
            toast.error('Delete failed');
        }
    };

    const getStockStatus = (p) => {
        if (p.stockLevel <= 0) return { text: 'Out of Stock', cls: 'badge-danger' };
        if (p.stockLevel <= p.reorderThreshold) return { text: 'Low Stock', cls: 'badge-warning' };
        return { text: 'In Stock', cls: 'badge-success' };
    };

    if (error) {
        return <ErrorState title="Failed to load Products" onRetry={fetchProducts} />;
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-end mb-8">
                    <div><div className="skeleton h-8 w-48 mb-2 rounded"></div><div className="skeleton h-4 w-64 rounded"></div></div>
                </div>
                <SkeletonTable rows={8} columns={5} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up mb-8">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-text">Inventory</h1>
                    <p className="text-text-muted mt-1.5 text-sm">{products.length} products in catalog</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowBulkModal(true)} className="btn-secondary flex items-center gap-2 active:scale-[0.98] transition-transform shadow-sm">
                        <HiOutlineCube className="w-4 h-4" /> Import CSV
                    </button>
                    <button onClick={openAddForm} className="btn-primary flex items-center gap-2 active:scale-[0.98] transition-transform shadow-sm">
                        {showForm && !editId ? <HiOutlineX className="w-4 h-4" /> : <HiOutlinePlus className="w-4 h-4" />}
                        {showForm && !editId ? 'Close' : 'Add Product'}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="glass-card p-6 md:p-8 animate-slide-up mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-amber-500 to-emerald-500"></div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-text tracking-tight flex items-center gap-2">
                                <HiOutlineCube className="w-5 h-5 text-primary" /> {editId ? 'Edit Product' : 'New Product'}
                            </h3>
                            <p className="text-sm text-text-muted mt-1">
                                {editId ? 'Update product details and specifications.' : 'Add a new product manually or auto-import metadata directly via URL.'}
                            </p>
                        </div>
                        <button onClick={() => { setShowForm(false); setEditId(null); }} className="p-2 rounded-full text-text-muted hover:text-text hover:bg-surface-lighter transition-colors">
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mode Tabs (Import via URL vs Manual Creation) */}
                    {!editId && (
                        <div className="flex items-center gap-3 p-1 rounded-xl bg-surface-lighter/60 border border-border w-fit mb-6">
                            <button
                                type="button"
                                onClick={() => setFormMode('url')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                    formMode === 'url'
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-text-muted hover:text-text'
                                }`}
                            >
                                <HiOutlineLink className="w-4 h-4" /> 1-Click URL Importer
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormMode('manual')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                    formMode === 'manual'
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-text-muted hover:text-text'
                                }`}
                            >
                                <HiOutlinePencil className="w-4 h-4" /> Manual Product Entry
                            </button>
                        </div>
                    )}

                    {/* URL Importer Section */}
                    {formMode === 'url' && !editId && (
                        <div className="p-5 rounded-2xl bg-surface-lighter/40 border border-border mb-6 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-text">
                                <HiOutlineLink className="w-4 h-4 text-primary" /> Paste Product URL (Amazon / Flipkart / Shopify)
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="url"
                                    value={importUrl}
                                    onChange={e => setImportUrl(e.target.value)}
                                    placeholder="https://www.amazon.in/dp/B0CX587PMP or Flipkart/Shopify product URL..."
                                    className="input-field flex-1 text-xs"
                                />
                                <button
                                    type="button"
                                    disabled={extractingUrl || !importUrl}
                                    onClick={handleExtractUrl}
                                    className="py-2.5 px-5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                                >
                                    {extractingUrl ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Fetching Metadata...
                                        </>
                                    ) : (
                                        <>
                                            <HiOutlineLightningBolt className="w-4 h-4" /> Fetch &amp; Auto-Fill
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2.5 text-xs text-primary-light">
                                <HiOutlineLightBulb className="w-4 h-4 shrink-0 text-amber-500" />
                                <span>Pasting a product URL auto-fills title, live selling price, specs, category, and sales channel links!</span>
                            </div>
                        </div>
                    )}

                    {/* Dynamic AI Competitor Precision Gauge */}
                    <div className="p-4 rounded-xl bg-surface-lighter/60 border border-border mb-6 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                                <HiOutlineShieldCheck className="w-4 h-4 text-primary" /> AI Competitor Matching Precision
                            </span>
                            <span className={`font-bold ${calculatePrecision() >= 90 ? 'text-emerald-500' : calculatePrecision() >= 70 ? 'text-amber-500' : 'text-primary'}`}>
                                {calculatePrecision()}% {calculatePrecision() >= 90 ? 'High Precision' : 'Basic Precision'}
                            </span>
                        </div>
                        <div className="w-full bg-surface border border-border h-2 rounded-full overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-primary via-amber-500 to-emerald-500 h-full transition-all duration-500" 
                                style={{ width: `${calculatePrecision()}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-text-muted">
                            {calculatePrecision() < 90 
                                ? '💡 Tip: Adding Amazon/Flipkart product links, brand name, and tech specs boosts AI competitor precision up to 98%.'
                                : '✨ Maximum AI precision! Complete brand specifications and live channel links provided.'}
                        </p>
                    </div>

                    {/* Strict Price Mismatch Alert Banner */}
                    {mismatchError && (
                        <div className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-slide-up transition-all ${
                            overrideMismatch 
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                                : 'bg-danger/10 border-danger/30 text-danger'
                        }`}>
                            <div className="flex items-start gap-3">
                                <HiOutlineExclamation className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-sm">
                                        {overrideMismatch ? 'Price Mismatch Acknowledged (Override Active)' : 'Price Mismatch Detected'}
                                    </p>
                                    <p className="mt-0.5 leading-relaxed">{mismatchError}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                {urlLivePrice && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForm(prev => ({ ...prev, currentPrice: String(urlLivePrice) }));
                                            setOverrideMismatch(false);
                                        }}
                                        className="px-3 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                                    >
                                        <HiOutlineLightningBolt className="w-3.5 h-3.5" />
                                        Sync to Live Price ({formatCurrency(urlLivePrice)})
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setOverrideMismatch(!overrideMismatch)}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border shrink-0 ${
                                        overrideMismatch
                                            ? 'bg-surface-lighter text-text border-border hover:bg-surface'
                                            : 'bg-danger/20 text-danger border-danger/30 hover:bg-danger/30'
                                    }`}
                                >
                                    {overrideMismatch ? 'Remove Override' : 'Use Custom Price'}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Basic Info */}
                            <div className="lg:col-span-2 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    
                                    {/* Short Name */}
                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[13px] font-medium text-text">Short Name (For Clean UI Display)</label>
                                            <button 
                                                type="button" 
                                                onClick={handleGenerateAiCopy} 
                                                disabled={isGenerating || (!form.name && !form.fullName)}
                                                className="text-[11px] font-semibold uppercase tracking-wider text-primary hover:text-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 active:scale-[0.98]"
                                            >
                                                <HiOutlineChip className="w-3.5 h-3.5" />
                                                AI Optimize Copy
                                            </button>
                                        </div>
                                        <input 
                                            className="input-field w-full" 
                                            placeholder="e.g. ASUS ROG Strix G16"
                                            value={form.shortName || form.name} 
                                            onChange={e => setForm({ ...form, shortName: e.target.value, name: e.target.value })} 
                                            required 
                                        />
                                    </div>

                                    {/* Full Official Title */}
                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label className="text-[13px] font-medium text-text">Full Official Name (For AI Matching &amp; Invoices)</label>
                                        <textarea 
                                            className="input-field w-full min-h-[60px] py-2 text-xs" 
                                            placeholder="e.g. ASUS ROG Strix G16 (2024) Gaming Laptop, 16' 165Hz FHD+ Display, Intel Core i7-13650HX, RTX 4060, 16GB RAM, 1TB SSD"
                                            value={form.fullName || form.name} 
                                            onChange={e => setForm({ ...form, fullName: e.target.value })} 
                                        />
                                    </div>

                                    {/* Brand & Model */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[13px] font-medium text-text">Brand</label>
                                        <input className="input-field" placeholder="e.g. ASUS, Apple, Dell" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[13px] font-medium text-text">Model Number / Variant</label>
                                        <input className="input-field" placeholder="e.g. G16-2024 / G614J" value={form.modelNumber} onChange={e => setForm({ ...form, modelNumber: e.target.value })} />
                                    </div>

                                    {/* Key Specs */}
                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label className="text-[13px] font-medium text-text">Key Specifications (Comma-separated)</label>
                                        <input className="input-field" placeholder="e.g. 16GB RAM, 1TB SSD, RTX 4060, 165Hz" value={form.keySpecs} onChange={e => setForm({ ...form, keySpecs: e.target.value })} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[13px] font-medium text-text">SKU</label>
                                        <input className="input-field" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
                                    </div>
                                    
                                    <div className="flex flex-col gap-1.5 relative">
                                        <label className="text-[13px] font-medium text-text">Category</label>
                                        <select className="input-field w-full" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                            {STANDARD_CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                            <option value="Other">Other (Custom)</option>
                                        </select>
                                    </div>

                                    {form.category === 'Other' && (
                                        <div className="flex flex-col gap-1.5 md:col-span-2">
                                            <label className="text-[13px] font-medium text-text">Custom Category</label>
                                            <input className="input-field w-full" value={customCategory} onChange={e => setCustomCategory(e.target.value)} required />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label className="text-[13px] font-medium text-text">Description</label>
                                        <textarea className="input-field w-full min-h-[90px] resize-y py-2.5" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* Pricing & Stock */}
                            <div className="space-y-5 bg-surface-lighter/30 p-5 rounded-2xl ring-1 ring-border/50 shadow-sm">
                                <h4 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Pricing &amp; Inventory</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[13px] font-medium text-text">Cost ({config.symbol})</label>
                                        <input className="input-field" type="number" step="0.01" value={form.baseCost} onChange={e => setForm({ ...form, baseCost: e.target.value })} required />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[13px] font-medium text-text">Selling Price ({config.symbol})</label>
                                        <input 
                                            className={`input-field ${mismatchError ? 'border-danger focus:border-danger ring-1 ring-danger/30' : ''}`} 
                                            type="number" 
                                            step="0.01" 
                                            value={form.currentPrice} 
                                            onChange={e => setForm({ ...form, currentPrice: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[13px] font-medium text-text">Min Margin %</label>
                                        <input className="input-field" type="number" step="0.1" value={form.minMargin} onChange={e => setForm({ ...form, minMargin: e.target.value })} />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[13px] font-medium text-text">Stock</label>
                                        <input className="input-field" type="number" value={form.stockLevel} onChange={e => setForm({ ...form, stockLevel: e.target.value })} required />
                                    </div>
                                    <div className="flex flex-col gap-1.5 col-span-2">
                                        <label className="text-[13px] font-medium text-text flex items-center justify-between">
                                            <span>Reorder Threshold</span>
                                            <span className="text-text/50 font-normal text-xs">(Low Stock Alert Level)</span>
                                        </label>
                                        <input className="input-field" type="number" value={form.reorderThreshold} onChange={e => setForm({ ...form, reorderThreshold: e.target.value })} />
                                    </div>
                                    <div className="flex flex-col gap-1.5 col-span-2">
                                        <label className="text-[13px] font-medium text-text flex items-center justify-between">
                                            <span>Sync Safety Buffer</span>
                                            <span className="text-text/50 font-normal text-xs">(Holdback units to prevent overselling)</span>
                                        </label>
                                        <input className="input-field" type="number" value={form.safetyBuffer} onChange={e => setForm({ ...form, safetyBuffer: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Product Links */}
                        <div className="space-y-4 pt-6 border-t border-border">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Sales Channels &amp; Benchmark Links</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="flex flex-col gap-1.5"><label className="text-[12px] text-text-muted">Amazon URL</label><input className="input-field text-xs" value={form.productLinks.amazon} onChange={e => setForm({ ...form, productLinks: { ...form.productLinks, amazon: e.target.value } })} /></div>
                                <div className="flex flex-col gap-1.5"><label className="text-[12px] text-text-muted">Flipkart URL</label><input className="input-field text-xs" value={form.productLinks.flipkart} onChange={e => setForm({ ...form, productLinks: { ...form.productLinks, flipkart: e.target.value } })} /></div>
                                <div className="flex flex-col gap-1.5"><label className="text-[12px] text-text-muted">Meesho URL</label><input className="input-field text-xs" value={form.productLinks.meesho} onChange={e => setForm({ ...form, productLinks: { ...form.productLinks, meesho: e.target.value } })} /></div>
                                <div className="flex flex-col gap-1.5"><label className="text-[12px] text-text-muted">Shopify URL</label><input className="input-field text-xs" value={form.productLinks.shopify} onChange={e => setForm({ ...form, productLinks: { ...form.productLinks, shopify: e.target.value } })} /></div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-6 border-t border-border">
                            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary px-6 active:scale-[0.98] transition-transform">
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={Boolean(mismatchError && !overrideMismatch)}
                                className="btn-primary px-6 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editId ? 'Save Changes' : 'Create Product'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {products.length === 0 ? (
                <div className="glass-card flex flex-col items-center justify-center py-24 text-center border-dashed border-2 border-border/50 bg-surface/30">
                    <div className="w-16 h-16 bg-surface-lighter rounded-2xl flex items-center justify-center mb-5 ring-1 ring-border/50 shadow-sm">
                        <HiOutlineCube className="w-8 h-8 text-text-muted" />
                    </div>
                    <h3 className="text-lg font-medium text-text mb-2 tracking-tight">No products found</h3>
                    <p className="text-text-muted text-sm max-w-sm mb-8 leading-relaxed">Import your sales data via CSV or manually add a product to get started.</p>
                    <button onClick={openAddForm} className="btn-primary flex items-center gap-2 active:scale-[0.98] transition-transform shadow-sm">
                        <HiOutlineCube className="w-4 h-4" /> Add Product
                    </button>
                </div>
            ) : (
                <div className="glass-card overflow-hidden animate-slide-up shadow-sm">
                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-border">
                        {products.map((p) => {
                            const status = getStockStatus(p);
                            const displayName = p.shortName || p.name;
                            const fullTitle = p.fullName || p.name;
                            const specsList = Array.isArray(p.keySpecs) ? p.keySpecs : [];

                            return (
                                <div key={p._id} className="p-5 flex flex-col gap-4 hover:bg-surface-lighter/30 transition-colors">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-surface-lighter border border-border flex items-center justify-center shrink-0">
                                                <HiOutlineCube className="w-5 h-5 text-text-muted" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-text leading-tight">{displayName}</p>
                                                {fullTitle !== displayName && (
                                                    <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5" title={fullTitle}>{fullTitle}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    <span className="text-xs font-mono text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border">{p.sku}</span>
                                                    {p.brand && <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">{p.brand}</span>}
                                                    <span className="text-xs text-text-muted">{p.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex flex-col p-3 bg-surface rounded-xl border border-border">
                                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-0.5">Price</span>
                                            <span className="font-semibold text-text">{formatCurrency(p.currentPrice)}</span>
                                        </div>
                                        <div className="flex flex-col p-3 bg-surface rounded-xl border border-border">
                                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-0.5">Stock</span>
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-text">{p.stockLevel}</span>
                                                <span className={`badge ${status.cls} px-1.5 py-0.5 text-[10px]`}>{status.text}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        <AskAIButton
                                            variant="chip"
                                            label="Ask AI"
                                            prompt={`Analyze pricing elasticity for SKU: ${p.sku} (${p.shortName || p.name}) at ₹${p.currentPrice}.`}
                                            contextData={{ productId: p._id, sku: p.sku, name: p.name, currentPrice: p.currentPrice }}
                                            className="flex-1 justify-center py-2"
                                        />
                                        <button onClick={() => setHistoryProduct(p)} className="flex-1 py-2 rounded-xl bg-surface border border-border text-text hover:bg-surface-lighter transition-all text-xs font-semibold flex items-center justify-center gap-1 active:scale-[0.98]">
                                            <HiOutlineChartBar className="w-3.5 h-3.5" /> Trend
                                        </button>
                                        <button onClick={() => handleEditClick(p)} className="flex-1 py-2 rounded-xl bg-surface border border-border text-text hover:bg-surface-lighter transition-all text-xs font-semibold active:scale-[0.98]">Edit</button>
                                        <button onClick={() => handleDelete(p._id)} className="flex-1 py-2 rounded-xl bg-surface border border-border text-danger hover:bg-danger/10 hover:border-danger/20 transition-all text-xs font-semibold active:scale-[0.98]">Delete</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-text-muted uppercase tracking-widest border-b border-border/40 bg-transparent">Product</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-text-muted uppercase tracking-widest border-b border-border/40 bg-transparent">SKU</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-text-muted uppercase tracking-widest border-b border-border/40 bg-transparent text-right">Base Cost</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-text-muted uppercase tracking-widest border-b border-border/40 bg-transparent text-right">Price</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-text-muted uppercase tracking-widest border-b border-border/40 bg-transparent text-right">Margin</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-text-muted uppercase tracking-widest border-b border-border/40 bg-transparent text-right">Stock</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-text-muted uppercase tracking-widest border-b border-border/40 bg-transparent text-center">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-text-muted uppercase tracking-widest border-b border-border/40 bg-transparent text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {products.map((p, i) => {
                                    const status = getStockStatus(p);
                                    const margin = ((p.currentPrice - p.baseCost) / p.currentPrice * 100).toFixed(1);
                                    const displayName = p.shortName || p.name;
                                    const fullTitle = p.fullName || p.name;
                                    const specsList = Array.isArray(p.keySpecs) ? p.keySpecs : [];

                                    return (
                                        <tr key={p._id} className="group hover:bg-surface-lighter/20 transition-colors animate-fade-in"
                                            style={{ animationDelay: `${i * 0.03}s` }}>
                                            <td className="px-6 py-4 whitespace-nowrap border-b border-border/40">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-surface-lighter/50 border border-border/50 flex items-center justify-center shrink-0 shadow-sm">
                                                        <HiOutlineCube className="w-4 h-4 text-text-muted" />
                                                    </div>
                                                    <div className="flex flex-col max-w-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[13px] font-bold text-text tracking-tight truncate">{displayName}</span>
                                                            {p.brand && (
                                                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                                    {p.brand}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {fullTitle !== displayName && (
                                                            <span className="text-[11px] text-text-muted truncate mt-0.5" title={fullTitle}>{fullTitle}</span>
                                                        )}
                                                        {specsList.length > 0 && (
                                                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                                {specsList.slice(0, 3).map((spec, sIdx) => (
                                                                    <span key={sIdx} className="text-[9px] font-semibold text-text-muted bg-surface-lighter px-1.5 py-0.5 rounded border border-border">
                                                                        {spec}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[12px] text-text-muted font-mono border-b border-border/40">{p.sku}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[13px] text-text-muted text-right border-b border-border/40">{formatCurrency(p.baseCost)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-text text-right border-b border-border/40">{formatCurrency(p.currentPrice)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[13px] text-right border-b border-border/40">
                                                <span className={`font-medium ${margin > 20 ? 'text-success' : margin > 10 ? 'text-warning' : 'text-danger'}`}>{margin}%</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[13px] text-text text-right font-medium border-b border-border/40">{p.stockLevel}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center border-b border-border/40">
                                                <span className={`badge ${status.cls}`}>{status.text}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center border-b border-border/40">
                                                <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                                    <AskAIButton 
                                                        variant="icon-button"
                                                        prompt={`Analyze pricing elasticity, competitor stance, and profit margin for product: ${p.shortName || p.name} (SKU: ${p.sku}). Current price is ₹${p.currentPrice} with base cost ₹${p.baseCost} and stock ${p.stockLevel}.`}
                                                        contextData={{ productId: p._id, sku: p.sku, name: p.name, currentPrice: p.currentPrice, baseCost: p.baseCost, stock: p.stockLevel }}
                                                    />
                                                    <button onClick={() => setHistoryProduct(p)} className="p-1.5 rounded-md text-text-muted hover:text-success hover:bg-success/10 transition-colors cursor-pointer" title="Trend">
                                                        <HiOutlineChartBar className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleEditClick(p)} className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer" title="Edit">
                                                        <HiOutlinePencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer" title="Delete">
                                                        <HiOutlineTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Price History Trend Modal */}
            {historyProduct && (
                <PriceHistoryModal
                    product={historyProduct}
                    onClose={() => setHistoryProduct(null)}
                />
            )}

            {/* Bulk Product CSV Import Modal */}
            {showBulkModal && (
                <BulkImportModal
                    onClose={() => setShowBulkModal(false)}
                    onSuccess={fetchProducts}
                />
            )}
        </div>
    );
}
