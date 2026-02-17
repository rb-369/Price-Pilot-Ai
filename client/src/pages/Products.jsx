import { useState, useEffect } from 'react';
import { getProducts, createProduct, deleteProduct } from '../api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineCube } from 'react-icons/hi';

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

    if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-header text-3xl">Products</h1>
                    <p className="text-text-muted mt-1">{products.length} products in inventory</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
                    <HiOutlinePlus className="w-5 h-5" /> Add Product
                </button>
            </div>

            {showForm && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-text mb-4">New Product</h3>
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
                        <div className="flex gap-2">
                            <button type="submit" className="btn-primary">Create</button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left px-6 py-4 text-sm font-medium text-text-muted">Product</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-text-muted">SKU</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-text-muted">Base Cost</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-text-muted">Price</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-text-muted">Margin</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-text-muted">Stock</th>
                                <th className="text-center px-6 py-4 text-sm font-medium text-text-muted">Status</th>
                                <th className="text-center px-6 py-4 text-sm font-medium text-text-muted">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {products.map(p => {
                                const status = getStockStatus(p);
                                const margin = ((p.currentPrice - p.baseCost) / p.currentPrice * 100).toFixed(1);
                                return (
                                    <tr key={p._id} className="hover:bg-surface-lighter/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <HiOutlineCube className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-text">{p.name}</p>
                                                    <p className="text-xs text-text-muted">{p.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-muted font-mono">{p.sku}</td>
                                        <td className="px-6 py-4 text-sm text-text-muted text-right">₹{p.baseCost}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-text text-right">₹{p.currentPrice}</td>
                                        <td className="px-6 py-4 text-sm text-right">
                                            <span className={margin > 20 ? 'text-success' : margin > 10 ? 'text-warning' : 'text-danger'}>{margin}%</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text text-right">{p.stockLevel}</td>
                                        <td className="px-6 py-4 text-center"><span className={status.cls}>{status.text}</span></td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleDelete(p._id)} className="p-2 text-text-muted hover:text-danger transition-colors"><HiOutlineTrash className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
