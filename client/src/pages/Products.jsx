import { useState, useEffect } from 'react';
import { getProducts, createProduct, deleteProduct } from '../api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCube, HiOutlineX } from 'react-icons/hi';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', sku: '', category: 'general', baseCost: '', currentPrice: '', minMargin: '0.1', stockLevel: '', reorderThreshold: '10' });
    const [loading, setLoading] = useState(true);

    const fetchProducts = () => {
        getProducts().then(r => setProducts(r.data)).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createProduct({ ...form, baseCost: +form.baseCost, currentPrice: +form.currentPrice, minMargin: +form.minMargin, stockLevel: +form.stockLevel, reorderThreshold: +form.reorderThreshold });
            toast.success('Product created');
            setShowForm(false);
            setForm({ name: '', sku: '', category: 'general', baseCost: '', currentPrice: '', minMargin: '0.1', stockLevel: '', reorderThreshold: '10' });
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
                <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
                    {showForm ? <HiOutlineX className="w-5 h-5" /> : <HiOutlinePlus className="w-5 h-5" />}
                    {showForm ? 'Close' : 'Add Product'}
                </button>
            </div>

            {showForm && (
                <div className="glass-card p-6 animate-slide-up">
                    <h3 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
                        <HiOutlineCube className="w-5 h-5 text-primary" /> New Product
                    </h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input className="input-field" placeholder="Product Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        <input className="input-field" placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
                        <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                            <option value="general">General</option><option value="Electronics">Electronics</option>
                            <option value="Footwear">Footwear</option><option value="Apparel">Apparel</option>
                            <option value="Groceries">Groceries</option><option value="Fitness">Fitness</option>
                        </select>
                        <input className="input-field" type="number" placeholder="Base Cost (₹)" value={form.baseCost} onChange={e => setForm({ ...form, baseCost: e.target.value })} required />
                        <input className="input-field" type="number" placeholder="Current Price (₹)" value={form.currentPrice} onChange={e => setForm({ ...form, currentPrice: e.target.value })} required />
                        <input className="input-field" type="number" step="0.01" placeholder="Min Margin (0.1 = 10%)" value={form.minMargin} onChange={e => setForm({ ...form, minMargin: e.target.value })} />
                        <input className="input-field" type="number" placeholder="Stock Level" value={form.stockLevel} onChange={e => setForm({ ...form, stockLevel: e.target.value })} required />
                        <input className="input-field" type="number" placeholder="Reorder Threshold" value={form.reorderThreshold} onChange={e => setForm({ ...form, reorderThreshold: e.target.value })} />
                        <div className="flex gap-2 items-end">
                            <button type="submit" className="btn-primary">Create</button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
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
                                                <button onClick={() => handleDelete(p._id)} className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all">
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </button>
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
