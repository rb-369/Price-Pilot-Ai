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

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="w-12 h-12 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    const heatmapData = signals.map(s => ({
        name: s.product?.name?.split(' ').slice(0, 2).join(' ') || 'Unknown',
        demand: Math.round((s.avgDemandScore || 0) * 100),
        trend: s.latestSignal?.searchTrendScore || 0,
        weather: Math.round(((s.latestSignal?.weatherFactor || 0) + 1) * 50),
        event: Math.round(((s.latestSignal?.eventFactor || 0) + 1) * 50),
        sentiment: Math.round(((s.latestSignal?.socialSentimentScore || 0) + 1) * 50),
    }));

    const latestSignal = productSignals[0];
    const radarData = latestSignal ? [
        { factor: 'Search Trends', value: latestSignal.searchTrendScore || 0 },
        { factor: 'Weather', value: Math.round(((latestSignal.weatherFactor || 0) + 1) * 50) },
        { factor: 'Events', value: Math.round(((latestSignal.eventFactor || 0) + 1) * 50) },
        { factor: 'Sentiment', value: Math.round(((latestSignal.socialSentimentScore || 0) + 1) * 50) },
        { factor: 'Composite', value: Math.round((latestSignal.compositeDemandScore || 0) * 100) },
    ] : [];

    const timeSeriesData = productSignals.slice(0, 14).reverse().map(s => ({
        date: new Date(s.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        score: Math.round((s.compositeDemandScore || 0) * 100),
        trend: s.searchTrendScore || 0,
    }));

    return (
        <div className="space-y-6">
            <div className="animate-slide-up">
                <h1 className="page-header text-3xl">Demand Signals</h1>
                <p className="text-text-muted mt-1 text-sm">Google Trends • Weather • Events • Social Sentiment</p>
            </div>

            {/* Demand Heatmap */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
                        <HiOutlineFire className="w-4 h-4 text-danger" />
                    </div>
                    <h2 className="text-base font-semibold text-text">Demand Intensity Heatmap</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {heatmapData.map((item, i) => {
                        const intensity = item.demand;
                        const bgColor = intensity > 70 ? 'from-red-500/20 to-orange-500/10 border-red-500/20' :
                            intensity > 50 ? 'from-yellow-500/15 to-amber-500/10 border-yellow-500/15' :
                                intensity > 30 ? 'from-blue-500/12 to-cyan-500/8 border-blue-500/12' : 'from-slate-500/10 to-slate-600/5 border-slate-500/10';
                        return (
                            <div key={i} className={`bg-gradient-to-br ${bgColor} rounded-xl p-4 border text-center transition-all hover:scale-[1.04] hover:shadow-lg animate-slide-up ${intensity > 70 ? 'animate-pulse-glow' : ''}`}
                                style={{ animationDelay: `${0.15 + i * 0.05}s` }}>
                                <p className="text-[11px] text-text-muted mb-1 truncate uppercase tracking-wider">{item.name}</p>
                                <p className="text-3xl font-bold text-text tracking-tight">{intensity}</p>
                                <p className="text-[10px] text-text-muted/70 uppercase tracking-wider mt-0.5">demand score</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Product Detail */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-base font-semibold text-text flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                            <HiOutlineTrendingUp className="w-4 h-4 text-accent" />
                        </div>
                        Signal Analysis
                    </h2>
                    <select className="input-field w-64" value={selectedProduct || ''}
                        onChange={e => setSelectedProduct(e.target.value)}>
                        <option value="">Select a product</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                </div>

                {selectedProduct && productSignals.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">Signal Breakdown</h3>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={280}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="rgba(99,102,241,0.1)" />
                                        <PolarAngleAxis dataKey="factor" tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 9 }} domain={[0, 100]} />
                                        <Radar name="Demand" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">Score Trend (14 Days)</h3>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={timeSeriesData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} />
                                        <Tooltip contentStyle={{ background: '#131b2e', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', color: '#f1f5f9', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
                                        <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} name="Composite" />
                                        <Bar dataKey="trend" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Trend" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-text-muted text-center py-16 text-sm">
                        <HiOutlineTrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        Select a product to analyze demand signals
                    </div>
                )}
            </div>
        </div>
    );
}
