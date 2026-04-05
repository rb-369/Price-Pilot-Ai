import { useState, useEffect } from 'react';
import { getLatestCompetitorPrices, getProducts, getCompetitorPrices } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HiOutlineScale, HiOutlineTrendingDown, HiOutlineTrendingUp } from 'react-icons/hi';

export default function Competitors() {
    const [prices, setPrices] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getLatestCompetitorPrices().then(r => setPrices(r.data)).catch(() => { }),
            getProducts().then(r => setProducts(r.data)).catch(() => { }),
        ]).finally(() => setLoading(false));
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

    const competitorColors = { Amazon: '#FF9900', Flipkart: '#2874F0', Myntra: '#FF3E6C', Snapdeal: '#E40046', Meesho: '#570A57' };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="w-12 h-12 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

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
            <div className="animate-slide-up">
                <h1 className="page-header text-3xl">Competitor Comparison</h1>
                <p className="text-text-muted mt-1 text-sm">Real-time competitor price monitoring</p>
            </div>

            {/* Price History Chart */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-text flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <HiOutlineScale className="w-4 h-4 text-primary" />
                        </div>
                        Price History
                    </h2>
                    <select className="input-field w-64" value={selectedProduct || ''}
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

            {/* Comparison Table */}
            <div className="glass-card overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="px-6 py-4 border-b border-[rgba(99,102,241,0.08)]">
                    <h2 className="text-base font-semibold text-text">Latest Competitor Prices</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[rgba(99,102,241,0.08)]">
                                <th className="text-left px-6 py-3 text-[11px] font-semibold text-text-muted">Product</th>
                                <th className="text-right px-6 py-3 text-[11px] font-semibold text-text-muted">Our Price</th>
                                <th className="text-left px-6 py-3 text-[11px] font-semibold text-text-muted">Competitor</th>
                                <th className="text-right px-6 py-3 text-[11px] font-semibold text-text-muted">Their Price</th>
                                <th className="text-center px-6 py-3 text-[11px] font-semibold text-text-muted">Stock</th>
                                <th className="text-right px-6 py-3 text-[11px] font-semibold text-text-muted">Diff</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(99,102,241,0.04)]">
                            {Object.entries(productPrices).map(([pid, data]) =>
                                data.competitors.map((comp, i) => {
                                    const diff = ((comp.price - data.product.currentPrice) / data.product.currentPrice * 100).toFixed(1);
                                    return (
                                        <tr key={`${pid}-${i}`} className="hover:bg-[rgba(99,102,241,0.03)] transition-colors">
                                            {i === 0 && (
                                                <>
                                                    <td className="px-6 py-3 text-sm font-medium text-text" rowSpan={data.competitors.length}>{data.product.name}</td>
                                                    <td className="px-6 py-3 text-sm font-semibold text-text text-right" rowSpan={data.competitors.length}>₹{data.product.currentPrice}</td>
                                                </>
                                            )}
                                            <td className="px-6 py-3 text-sm text-text">{comp.name}</td>
                                            <td className="px-6 py-3 text-sm font-medium text-text text-right">₹{comp.price}</td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`badge ${comp.inStock ? 'badge-success' : 'badge-danger'}`}>{comp.inStock ? 'In Stock' : 'OOS'}</span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className={`text-sm font-semibold flex items-center justify-end gap-1 ${diff > 0 ? 'text-success' : 'text-danger'}`}>
                                                    {diff > 0 ? <HiOutlineTrendingUp className="w-4 h-4" /> : <HiOutlineTrendingDown className="w-4 h-4" />}
                                                    {diff > 0 ? '+' : ''}{diff}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
