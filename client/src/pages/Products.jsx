import { useState, useEffect } from 'react';
import { getProducts, createProduct, deleteProduct, updateProduct, generateProductDescription } from '../api';
import { useCurrency } from '../context/CurrencyContext';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCube, HiOutlineX, HiOutlinePencil, HiOutlineChartBar } from 'react-icons/hi';
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
    name: '', sku: '', category: 'General', 
    baseCost: '', currentPrice: '', minMargin: '10', 
    stockLevel: '', reorderThreshold: '10',
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

    const fetchProducts = () => {
        setLoading(true);
        setError(false);
        getProducts()
            .then(r => setProducts(r.data.data || r.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    const handleGenerateAiCopy = async () => {
        if (!form.name) {
            toast.error('Please enter a Product Name first');
            return;
        }
        setIsGenerating(true);
        const toastId = toast.loading('Generating AI description & SEO tags...');
        try {
            const finalCategory = form.category === 'Other' ? customCategory : form.category;
            const res = await generateProductDescription({ productName: form.name, category: finalCategory });
            toast.success('AI description generated!', { id: toastId });
            setForm(prev => ({
                ...prev,
                name: res.data.title || prev.name,
                description: res.data.description || prev.description
            }));
            if (res.data.description) {
                toast.success('Description filled automatically!', { duration: 3000 });
            }
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
        setEditId(null);
        setShowForm(!showForm);
    };

    const handleEditClick = (p) => {
        setEditId(p._id);
        const isStandard = STANDARD_CATEGORIES.includes(p.category);
        
        setForm({
            name: p.name || '',
            sku: p.sku || '',
            category: isStandard ? p.category : 'Other',
            baseCost: p.baseCost || '',
            currentPrice: p.currentPrice || '',
            minMargin: p.minMargin ? (p.minMargin * 100).toString() : '10',
            stockLevel: p.stockLevel || '',
            reorderThreshold: p.reorderThreshold || '10',
            description: p.description || '',
            productLinks: p.productLinks || { amazon: '', flipkart: '', meesho: '', shopify: '' }
        });
        
        if (!isStandard) {
            setCustomCategory(p.category);
        } else {
            setCustomCategory('');
        }
        
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const finalCategory = form.category === 'Other' ? customCategory : form.category;
            const payload = { 
                ...form, 
                category: finalCategory,
                baseCost: +form.baseCost, 
                currentPrice: +form.currentPrice, 
                minMargin: (+form.minMargin) / 100, 
                stockLevel: +form.stockLevel, 
                reorderThreshold: +form.reorderThreshold 
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
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-medium text-text tracking-tight">
                                {editId ? 'Edit Product' : 'New Product'}
                            </h3>
                            <p className="text-sm text-text-muted mt-1.5">
                                {editId ? 'Update product details and inventory.' : 'Add a new product to your catalog.'}
                            </p>
                        </div>
                        <button onClick={() => { setShowForm(false); setEditId(null); }} className="p-2 rounded-full text-text-muted hover:text-text hover:bg-surface-lighter transition-colors">
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Basic Info */}
                            <div className="lg:col-span-2 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[13px] font-medium text-text">Product Name</label>
                                            <button 
                                                type="button" 
                                                onClick={handleGenerateAiCopy} 
                                                disabled={isGenerating || !form.name}
                                                className="text-[11px] font-semibold uppercase tracking-wider text-primary hover:text-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 active:scale-[0.98]"
                                            >
                                                ✨ AI Optimize
                                            </button>
                                        </div>
                                        <input className="input-field w-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
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
                                        <textarea className="input-field w-full min-h-[100px] resize-y py-3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* Pricing & Stock */}
                            <div className="space-y-5 bg-surface-lighter/30 p-5 rounded-2xl ring-1 ring-border/50 shadow-sm">
                                <h4 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Pricing & Inventory</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[13px] font-medium text-text">Cost ({config.symbol})</label>
                                        <input className="input-field" type="number" step="0.01" value={form.baseCost} onChange={e => setForm({ ...form, baseCost: e.target.value })} required />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[13px] font-medium text-text">Price ({config.symbol})</label>
                                        <input className="input-field" type="number" step="0.01" value={form.currentPrice} onChange={e => setForm({ ...form, currentPrice: e.target.value })} required />
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
                                        <label className="text-[13px] font-medium text-text">Reorder Threshold</label>
                                        <input className="input-field" type="number" value={form.reorderThreshold} onChange={e => setForm({ ...form, reorderThreshold: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Product Links */}
                        <div className="space-y-4 pt-6 border-t border-border">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Sales Channels</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="flex flex-col gap-1.5"><label className="text-[12px] text-text-muted">Amazon URL</label><input className="input-field" value={form.productLinks.amazon} onChange={e => setForm({ ...form, productLinks: { ...form.productLinks, amazon: e.target.value } })} /></div>
                                <div className="flex flex-col gap-1.5"><label className="text-[12px] text-text-muted">Flipkart URL</label><input className="input-field" value={form.productLinks.flipkart} onChange={e => setForm({ ...form, productLinks: { ...form.productLinks, flipkart: e.target.value } })} /></div>
                                <div className="flex flex-col gap-1.5"><label className="text-[12px] text-text-muted">Meesho URL</label><input className="input-field" value={form.productLinks.meesho} onChange={e => setForm({ ...form, productLinks: { ...form.productLinks, meesho: e.target.value } })} /></div>
                                <div className="flex flex-col gap-1.5"><label className="text-[12px] text-text-muted">Shopify URL</label><input className="input-field" value={form.productLinks.shopify} onChange={e => setForm({ ...form, productLinks: { ...form.productLinks, shopify: e.target.value } })} /></div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-6 border-t border-border">
                            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary px-6 active:scale-[0.98] transition-transform">
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary px-6 active:scale-[0.98] transition-transform">
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
                            return (
                                <div key={p._id} className="p-5 flex flex-col gap-4 hover:bg-surface-lighter/30 transition-colors">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-surface-lighter border border-border flex items-center justify-center shrink-0">
                                                <HiOutlineCube className="w-5 h-5 text-text-muted" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-text leading-tight">{p.name}</p>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-xs font-mono text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border">{p.sku}</span>
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
                                    return (
                                        <tr key={p._id} className="group hover:bg-surface-lighter/20 transition-colors animate-fade-in"
                                            style={{ animationDelay: `${i * 0.03}s` }}>
                                            <td className="px-6 py-4 whitespace-nowrap border-b border-border/40">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-surface-lighter/50 border border-border/50 flex items-center justify-center shrink-0 shadow-sm">
                                                        <HiOutlineCube className="w-4 h-4 text-text-muted" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-medium text-text tracking-tight">{p.name}</span>
                                                        <span className="text-[11px] text-text-muted mt-0.5">{p.category}</span>
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
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setHistoryProduct(p)} className="p-1.5 rounded-md text-text-muted hover:text-success hover:bg-success/10 transition-colors" title="Trend">
                                                        <HiOutlineChartBar className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleEditClick(p)} className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors" title="Edit">
                                                        <HiOutlinePencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors" title="Delete">
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
