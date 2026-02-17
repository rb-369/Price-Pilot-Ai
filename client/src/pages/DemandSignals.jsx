import { useState, useEffect } from 'react';
import { getAllDemandSignals, getProducts, getDemandSignals } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { HiOutlineTrendingUp, HiOutlineFire } from 'react-icons/hi';

export default function DemandSignals() {
    const [signals, setSignals] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productSignals, setProductSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getAllDemandSignals().then(r => setSignals(r.data)).catch(() => { }),
            getProducts().then(r => setProducts(r.data)).catch(() => { }),
        ]).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            getDemandSignals(selectedProduct).then(r => setProductSignals(r.data)).catch(() => { });
        }
    }, [selectedProduct]);

    if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

    // Heatmap-style data
    const heatmapData = signals.map(s => ({
        name: s.product?.name?.split(' ').slice(0, 2).join(' ') || 'Unknown',
        demand: Math.round((s.avgDemandScore || 0) * 100),
        trend: s.latestSignal?.searchTrendScore || 0,
        weather: Math.round(((s.latestSignal?.weatherFactor || 0) + 1) * 50),
        event: Math.round(((s.latestSignal?.eventFactor || 0) + 1) * 50),
        sentiment: Math.round(((s.latestSignal?.socialSentimentScore || 0) + 1) * 50),
    }));

    // Radar data for selected product
    const latestSignal = productSignals[0];
    const radarData = latestSignal ? [
        { factor: 'Search Trends', value: latestSignal.searchTrendScore || 0 },
        { factor: 'Weather', value: Math.round(((latestSignal.weatherFactor || 0) + 1) * 50) },
        { factor: 'Events', value: Math.round(((latestSignal.eventFactor || 0) + 1) * 50) },
        { factor: 'Sentiment', value: Math.round(((latestSignal.socialSentimentScore || 0) + 1) * 50) },
        { factor: 'Composite', value: Math.round((latestSignal.compositeDemandScore || 0) * 100) },
    ] : [];

    // Time series for selected product
    const timeSeriesData = productSignals.slice(0, 14).reverse().map(s => ({
        date: new Date(s.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        score: Math.round((s.compositeDemandScore || 0) * 100),
        trend: s.searchTrendScore || 0,
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-header text-3xl">Demand Signals</h1>
                <p className="text-text-muted mt-1">Google Trends • Weather • Events • Social Sentiment</p>
            </div>

            {/* Demand Heatmap */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-6">
                    <HiOutlineFire className="w-5 h-5 text-danger" />
                    <h2 className="text-lg font-semibold text-text">Demand Intensity Heatmap</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {heatmapData.map((item, i) => {
                        const intensity = item.demand;
                        const bgColor = intensity > 70 ? 'from-red-500/30 to-orange-500/20' :
                            intensity > 50 ? 'from-yellow-500/25 to-amber-500/15' :
                                intensity > 30 ? 'from-blue-500/20 to-cyan-500/10' : 'from-slate-500/15 to-slate-600/10';
                        return (
                            <div key={i} className={`bg-gradient-to-br ${bgColor} rounded-xl p-4 border border-border/30 text-center transition-transform hover:scale-105`}>
                                <p className="text-xs text-text-muted mb-1 truncate">{item.name}</p>
                                <p className="text-2xl font-bold text-text">{intensity}</p>
                                <p className="text-xs text-text-muted">demand score</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Product Detail */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-text flex items-center gap-2">
                        <HiOutlineTrendingUp className="w-5 h-5 text-accent" /> Signal Analysis
                    </h2>
                    <select className="input-field w-64" value={selectedProduct || ''}
                        onChange={e => setSelectedProduct(e.target.value)}>
                        <option value="">Select a product</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                </div>

                {selectedProduct && productSignals.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Radar Chart */}
                        <div>
                            <h3 className="text-sm font-medium text-text-muted mb-4">Signal Breakdown</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="#334155" />
                                    <PolarAngleAxis dataKey="factor" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <PolarRadiusAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
                                    <Radar name="Demand" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Time Series */}
                        <div>
                            <h3 className="text-sm font-medium text-text-muted mb-4">Score Trend (14 Days)</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 100]} />
                                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }} />
                                    <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} name="Composite" />
                                    <Bar dataKey="trend" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Trend" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <p className="text-text-muted text-center py-12">Select a product to analyze demand signals</p>
                )}
            </div>
        </div>
    );
}
