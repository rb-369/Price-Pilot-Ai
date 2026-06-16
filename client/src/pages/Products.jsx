import { useState, useEffect } from 'react';
import { getProducts, createProduct, deleteProduct, updateProduct } from '../api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCube, HiOutlineX, HiOutlinePencil } from 'react-icons/hi';

const STANDARD_CATEGORIES = [
    "General", "Electronics", "Footwear", "Apparel", "Groceries", 
    "Fitness", "Beauty & Personal Care", "Home & Kitchen", 
    "Toys & Games", "Automotive", "Sports & Outdoors", 
    "Books & Media", "Health & Wellness", "Jewelry & Accessories"
];

const DEFAULT_FORM_STATE = { 
    name: '', sku: '', category: 'General', 
    baseCost: '', currentPrice: '', minMargin: '0.1', 
    stockLevel: '', reorderThreshold: '10' 
};

export default function Products() {
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(DEFAULT_FORM_STATE);
    const [customCategory, setCustomCategory] = useState('');
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProducts = () => {
        getProducts().then(r => setProducts(r.data.data || r.data)).catch(() => { }).finally(() => setLoading(false));
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
            minMargin: p.minMargin || '0.1',
            stockLevel: p.stockLevel || '',
            reorderThreshold: p.reorderThreshold || '10'
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
                minMargin: +form.minMargin, 
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
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const getStockStatus = (p) => {
        if (p.stockLevel <= 0) return { text: 'Out of Stock', cls: 'badge-danger' };
        if (p.stockLevel <= p.reorderThreshold) return { text: 'Low Stock', cls: 'badge-warning' };
        return { text: 'In Stock', cls: 'badge-success' };
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="w-12 h-12 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between animate-slide-up">
                <div>
                    <h1 className="page-header text-3xl">Products</h1>
                    <p className="text-text-muted mt-1 text-sm">{products.length} products in inventory</p>
                </div>
                <button onClick={openAddForm} className="btn-primary flex items-center gap-2">
                    {showForm && !editId ? <HiOutlineX className="w-5 h-5" /> : <HiOutlinePlus className="w-5 h-5" />}
                    {showForm && !editId ? 'Close' : 'Add Product'}
                </button>
            </div>

            {showForm && (
                <div className="glass-card p-6 animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-text flex items-center gap-2">
                            <HiOutlineCube className="w-5 h-5 text-primary" /> {editId ? 'Edit Product' : 'New Product'}
                        </h3>
                        <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-text-muted hover:text-text transition-colors">
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input className="input-field" placeholder="Product Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        <input className="input-field" placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
                        
                        <div className="relative">
                            <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                {STANDARD_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                                <option value="Other">Other (Custom)</option>
                            </select>
                        </div>
                        {form.category === 'Other' && (
                            <input className="input-field" placeholder="Type your custom category..." value={customCategory} onChange={e => setCustomCategory(e.target.value)} required />
                        )}

                        <input className="input-field" type="number" placeholder="Base Cost (₹)" value={form.baseCost} onChange={e => setForm({ ...form, baseCost: e.target.value })} required />
                        <input className="input-field" type="number" placeholder="Current Price (₹)" value={form.currentPrice} onChange={e => setForm({ ...form, currentPrice: e.target.value })} required />
                        <input className="input-field" type="number" step="0.01" placeholder="Min Margin (0.1 = 10%)" value={form.minMargin} onChange={e => setForm({ ...form, minMargin: e.target.value })} />
                        <input className="input-field" type="number" placeholder="Stock Level" value={form.stockLevel} onChange={e => setForm({ ...form, stockLevel: e.target.value })} required />
                        <input className="input-field" type="number" placeholder="Reorder Threshold" value={form.reorderThreshold} onChange={e => setForm({ ...form, reorderThreshold: e.target.value })} />
                        <div className="flex gap-2 items-end md:col-start-1 md:col-end-4 mt-2">
                            <button type="submit" className="btn-primary flex-[0.5] flex justify-center">
                                {editId ? 'Save Changes' : 'Create Product'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary flex-[0.5] flex justify-center">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {products.length === 0 ? (
                <div className="glass-card empty-state">
                    <HiOutlineCube className="empty-state-icon w-16 h-16" />
                    <h3 className="text-lg font-semibold text-text mb-1">No products yet</h3>
                    <p className="text-text-muted text-sm">Add your first product to get started with AI pricing</p>
                </div>
            ) : (
                <div className="glass-card overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[rgba(99,102,241,0.08)]">
                                    <th className="text-left px-6 py-4 text-[11px] font-semibold text-text-muted">Product</th>
                                    <th className="text-left px-6 py-4 text-[11px] font-semibold text-text-muted">SKU</th>
                                    <th className="text-right px-6 py-4 text-[11px] font-semibold text-text-muted">Base Cost</th>
                                    <th className="text-right px-6 py-4 text-[11px] font-semibold text-text-muted">Price</th>
                                    <th className="text-right px-6 py-4 text-[11px] font-semibold text-text-muted">Margin</th>
                                    <th className="text-right px-6 py-4 text-[11px] font-semibold text-text-muted">Stock</th>
                                    <th className="text-center px-6 py-4 text-[11px] font-semibold text-text-muted">Status</th>
                                    <th className="text-center px-6 py-4 text-[11px] font-semibold text-text-muted">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgba(99,102,241,0.04)]">
                                {products.map((p, i) => {
                                    const status = getStockStatus(p);
                                    const margin = ((p.currentPrice - p.baseCost) / p.currentPrice * 100).toFixed(1);
                                    return (
                                        <tr key={p._id} className="hover:bg-[rgba(99,102,241,0.03)] transition-colors animate-fade-in"
                                            style={{ animationDelay: `${i * 0.03}s` }}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
                                                        <HiOutlineCube className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-text">{p.name}</p>
                                                        <p className="text-[11px] text-text-muted">{p.category}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-muted font-mono text-xs">{p.sku}</td>
                                            <td className="px-6 py-4 text-sm text-text-muted text-right">₹{p.baseCost}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-text text-right">₹{p.currentPrice}</td>
                                            <td className="px-6 py-4 text-sm text-right">
                                                <span className={`font-semibold ${margin > 20 ? 'text-success' : margin > 10 ? 'text-warning' : 'text-danger'}`}>{margin}%</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text text-right font-medium">{p.stockLevel}</td>
                                            <td className="px-6 py-4 text-center"><span className={`badge ${status.cls}`}>{status.text}</span></td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEditClick(p)} className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all" title="Edit">
                                                        <HiOutlinePencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(p._id)} className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all" title="Delete">
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
        </div>
    );
}
