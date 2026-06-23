import { useState, useEffect } from 'react';
import { getAllDemandSignals, getProducts, getDemandSignals } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { HiOutlineTrendingUp, HiOutlineFire, HiDownload } from 'react-icons/hi';
import { SkeletonCard } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import { exportToCSV } from '../utils/export';

export default function DemandSignals() {
    const [signals, setSignals] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productSignals, setProductSignals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchData = () => {
        setLoading(true);
        setError(false);
        Promise.all([
            getAllDemandSignals().then(r => setSignals(r.data)).catch(() => { throw new Error() }),
            getProducts().then(r => setProducts(r.data.data || r.data)).catch(() => { throw new Error() }),
        ]).catch(() => setError(true)).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            getDemandSignals(selectedProduct).then(r => setProductSignals(r.data)).catch(() => { });
        }
    }, [selectedProduct]);

    const handleExport = () => {
        const exportData = signals.map(s => ({
            Product: s.product?.name || 'Unknown',
            Demand_Score: Math.round((s.avgDemandScore || 0) * 100),
            Search_Trend: s.latestSignal?.searchTrendScore || 0,
            Weather_Factor: Math.round(((s.latestSignal?.weatherFactor || 0) + 1) * 50),
            Event_Factor: Math.round(((s.latestSignal?.eventFactor || 0) + 1) * 50),
            Sentiment_Score: Math.round(((s.latestSignal?.socialSentimentScore || 0) + 1) * 50)
        }));
        exportToCSV(exportData, 'demand-signals-heatmap');
    };

    if (error) return <ErrorState title="Failed to load Demand Signals" onRetry={fetchData} />;

    if (loading) return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div><div className="skeleton h-8 w-64 mb-2 rounded"></div><div className="skeleton h-4 w-48 rounded"></div></div>
            </div>
            <SkeletonCard className="h-48 mb-6" />
            <SkeletonCard className="h-96" />
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
            <div className="animate-slide-up flex justify-between items-end">
                <div>
                    <h1 className="page-header text-3xl">Demand Signals</h1>
                    <p className="text-text-muted mt-1 text-sm">Google Trends • Weather • Events • Social Sentiment</p>
                </div>
                {signals.length > 0 && (
                    <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                        <HiDownload className="w-5 h-5" /> Export Heatmap CSV
                    </button>
                )}
            </div>

            {products.length === 0 ? (
                <div className="glass-card p-12 flex flex-col items-center justify-center text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <HiOutlineFire className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-text mb-3">No Demand Signals Yet</h2>
                    <p className="text-text-muted max-w-md mx-auto mb-8">
                        Add a product to start analyzing Google Search Trends, weather impacts, local events, and social media sentiment signals.
                    </p>
                    <a href="/products" className="btn-primary">
                        Add Your First Product
                    </a>
                </div>
            ) : (
                <>
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
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h2 className="text-base font-semibold text-text flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                            <HiOutlineTrendingUp className="w-4 h-4 text-accent" />
                        </div>
                        Signal Analysis
                    </h2>
                    <select className="input-field w-full md:w-64" value={selectedProduct || ''}
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
            </>
            )}
        </div>
    );
}
