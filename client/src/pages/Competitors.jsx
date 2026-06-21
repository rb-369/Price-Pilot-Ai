import { useState, useEffect } from 'react';
import { getLatestCompetitorPrices, getProducts, getCompetitorPrices, deleteProduct } from '../api';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HiOutlineScale, HiOutlineTrendingDown, HiOutlineTrendingUp, HiDownload, HiOutlineTrash, HiOutlineCube } from 'react-icons/hi';
import { SkeletonTable, SkeletonCard } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import { exportToCSV } from '../utils/export';

export default function Competitors() {
    const [prices, setPrices] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchData = () => {
        setLoading(true);
        setError(false);
        Promise.all([
            getLatestCompetitorPrices().then(r => setPrices(r.data)).catch(() => { throw new Error('Failed to fetch prices') }),
            getProducts().then(r => setProducts(r.data.data || r.data)).catch(() => { throw new Error('Failed to fetch products') }),
        ]).catch(() => {
            setError(true);
        }).finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            getCompetitorPrices(selectedProduct).then(r => {
                const grouped = {};
                r.data.forEach(cp => {
                    const day = new Date(cp.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                    if (!grouped[day]) grouped[day] = { day };
                    grouped[day][cp.competitorName] = cp.competitorPrice;
                });
                setHistory(Object.values(grouped).reverse().slice(-15));
            }).catch(() => { });
        }
    }, [selectedProduct]);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await deleteProduct(id);
            toast.success('Product deleted');
            fetchData();
            if (selectedProduct === id) setSelectedProduct(null);
        } catch (err) {
            toast.error('Failed to delete product');
        }
    };

    const handleExport = () => {
        const exportData = [];
        Object.entries(productPrices).forEach(([pid, data]) => {
            data.competitors.forEach(comp => {
                exportData.push({
                    Product: data.product.name,
                    SKU: data.product.sku,
                    Our_Price: data.product.currentPrice,
                    Competitor_Name: comp.name,
                    Competitor_Price: comp.price,
                    In_Stock: comp.inStock ? 'Yes' : 'No',
                    Difference_Pct: ((comp.price - data.product.currentPrice) / data.product.currentPrice * 100).toFixed(1)
                });
            });
        });
        exportToCSV(exportData, 'competitor-prices');
    };

    const competitorColors = { Amazon: '#FF9900', Flipkart: '#2874F0', Myntra: '#FF3E6C', Snapdeal: '#E40046', Meesho: '#570A57' };

    if (error) {
        return <ErrorState title="Failed to load Competitor data" onRetry={fetchData} />;
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-end mb-8">
                    <div><div className="skeleton h-8 w-64 mb-2 rounded"></div><div className="skeleton h-4 w-48 rounded"></div></div>
                </div>
                <SkeletonCard className="h-[400px]" />
                <SkeletonTable rows={5} columns={6} />
            </div>
        );
    }

    const productPrices = {};
    prices.forEach(p => {
        const pid = p._id?.productId?.toString();
        if (!productPrices[pid]) productPrices[pid] = { product: p.product, competitors: [] };
        productPrices[pid].competitors.push({
            name: p._id.competitorName, price: p.latestPrice,
            inStock: p.inStock, timestamp: p.timestamp,
        });
    });

    return (
        <div className="space-y-6">
            <div className="animate-slide-up flex justify-between items-end">
                <div>
                    <h1 className="page-header text-3xl">Competitor Comparison</h1>
                    <p className="text-text-muted mt-1 text-sm">Real-time competitor price monitoring</p>
                </div>
                <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                    <HiDownload className="w-5 h-5" /> Export CSV
                </button>
            </div>

            {/* Price History Chart */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <h2 className="text-base font-semibold text-text flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <HiOutlineScale className="w-4 h-4 text-primary" />
                        </div>
                        Price History
                    </h2>
                    <select className="input-field w-full md:w-64" value={selectedProduct || ''}
                        onChange={e => setSelectedProduct(e.target.value)}>
                        <option value="">Select a product</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                </div>
                {history.length > 0 ? (
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} />
                                <Tooltip contentStyle={{ background: '#131b2e', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', color: '#f1f5f9', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
                                <Legend />
                                {Object.keys(competitorColors).map(comp => (
                                    history.some(h => h[comp]) && <Line key={comp} type="monotone" dataKey={comp} stroke={competitorColors[comp]} strokeWidth={2} dot={{ r: 3, fill: competitorColors[comp] }} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-text-muted text-center py-16 text-sm">
                        <HiOutlineScale className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        Select a product to view competitor price history
                    </div>
                )}
            </div>

            {/* Comparison Table Section */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-base font-semibold text-text mb-4 px-1">Latest Competitor Prices</h2>
                
                {/* Mobile View */}
                <div className="md:hidden flex flex-col gap-6">
                    {Object.entries(productPrices).map(([pid, data]) => (
                        <div key={pid} className="glass-card overflow-hidden shadow-sm">
                            <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 border-b border-[rgba(99,102,241,0.1)] flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-text text-base">{data.product.name}</h3>
                                    <p className="text-xs text-text-muted mt-1 font-medium">Our Price: <span className="font-semibold text-text">₹{data.product.currentPrice}</span></p>
                                </div>
                                <button onClick={() => handleDelete(pid)} className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all bg-surface/50 border border-transparent hover:border-danger/20 shadow-sm" title="Delete Product">
                                    <HiOutlineTrash className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="divide-y divide-[rgba(99,102,241,0.04)]">
                                {data.competitors.map((comp, i) => {
                                    const diff = ((comp.price - data.product.currentPrice) / data.product.currentPrice * 100).toFixed(1);
                                    return (
                                        <div key={i} className="p-4 flex flex-col gap-3 hover:bg-[rgba(99,102,241,0.02)] transition-colors">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-text">{comp.name}</span>
                                                <span className={`badge ${comp.inStock ? 'badge-success' : 'badge-danger'}`}>{comp.inStock ? 'In Stock' : 'OOS'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-text-muted text-sm block">Their Price: <span className="font-semibold text-text">₹{comp.price}</span></span>
                                                <span className={`text-sm font-bold flex items-center gap-1 ${diff > 0 ? 'text-success' : 'text-danger'}`}>
                                                    {diff > 0 ? <HiOutlineTrendingUp className="w-4 h-4" /> : <HiOutlineTrendingDown className="w-4 h-4" />}
                                                    {diff > 0 ? '+' : ''}{diff}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:flex flex-col gap-6">
                    {/* Header Row */}
                    <div className="glass-card px-6 py-4 flex w-full">
                        <div className="w-[40%] text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Competitor</div>
                        <div className="w-[20%] text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Their Price</div>
                        <div className="w-[20%] text-center text-xs font-semibold text-text-muted uppercase tracking-wider">Stock</div>
                        <div className="w-[20%] text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Difference</div>
                    </div>

                    {/* Product Cards */}
                    {Object.entries(productPrices).map(([pid, data]) => (
                        <div key={pid} className="glass-card overflow-hidden shadow-sm">
                            <div className="bg-gradient-to-r from-[rgba(99,102,241,0.1)] to-transparent border-b border-[rgba(99,102,241,0.15)] px-6 py-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[rgba(99,102,241,0.15)] flex items-center justify-center text-primary border border-[rgba(99,102,241,0.2)]">
                                        <HiOutlineCube className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-text text-base tracking-tight">{data.product.name}</span>
                                        <span className="text-sm text-text-muted ml-4 font-medium">Our Price: <span className="text-text font-semibold">₹{data.product.currentPrice}</span></span>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(pid)} className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all border border-transparent hover:border-danger/20 bg-surface/50 shadow-sm" title="Delete Product">
                                    <HiOutlineTrash className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="flex flex-col">
                                {data.competitors.map((comp, i) => {
                                    const diff = ((comp.price - data.product.currentPrice) / data.product.currentPrice * 100).toFixed(1);
                                    const isLast = i === data.competitors.length - 1;
                                    return (
                                        <div key={`${pid}-${i}`} className={`flex items-stretch w-full hover:bg-[rgba(99,102,241,0.03)] transition-colors ${!isLast ? 'border-b border-[rgba(99,102,241,0.03)]' : ''}`}>
                                            <div className="w-[40%] px-6 py-4 text-sm font-medium text-text pl-16 relative flex items-center">
                                                {/* Visual tree line connector */}
                                                <div className={`absolute left-9 top-0 w-px bg-[rgba(99,102,241,0.2)] ${isLast ? 'h-1/2' : 'h-full'}`}></div>
                                                <div className="absolute left-9 top-1/2 w-4 h-px bg-[rgba(99,102,241,0.2)]"></div>
                                                {comp.name}
                                            </div>
                                            <div className="w-[20%] px-6 py-4 text-sm font-semibold text-text text-right flex items-center justify-end">₹{comp.price}</div>
                                            <div className="w-[20%] px-6 py-4 text-center flex items-center justify-center">
                                                <span className={`badge ${comp.inStock ? 'badge-success' : 'badge-danger'}`}>{comp.inStock ? 'In Stock' : 'OOS'}</span>
                                            </div>
                                            <div className="w-[20%] px-6 py-4 text-right flex items-center justify-end">
                                                <span className={`text-sm font-bold flex items-center justify-end gap-1 ${diff > 0 ? 'text-success' : 'text-danger'}`}>
                                                    {diff > 0 ? <HiOutlineTrendingUp className="w-4 h-4" /> : <HiOutlineTrendingDown className="w-4 h-4" />}
                                                    {diff > 0 ? '+' : ''}{diff}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
