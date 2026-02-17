import { useState, useEffect } from 'react';
import { getForecasts, getProducts, generateForecast } from '../api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { HiOutlineTrendingUp, HiOutlineRefresh } from 'react-icons/hi';

export default function Forecasts() {
    const [forecasts, setForecasts] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(null);

    useEffect(() => {
        Promise.all([
            getForecasts().then(r => setForecasts(r.data)).catch(() => { }),
            getProducts().then(r => setProducts(r.data)).catch(() => { }),
        ]).finally(() => setLoading(false));
    }, []);

    const handleGenerate = async (productId) => {
        setGenerating(productId);
        try {
            const res = await generateForecast(productId, 30);
            setForecasts(prev => [res.data, ...prev]);
            toast.success('Forecast generated');
        } catch (err) {
            toast.error('Forecast generation failed — is the AI service running?');
        } finally {
            setGenerating(null);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-header text-3xl">Inventory Forecasts</h1>
                <p className="text-text-muted mt-1">AI-powered 30–60 day demand prediction</p>
            </div>

            {/* Generate Section */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-text mb-4">Generate New Forecast</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {products.slice(0, 10).map(p => (
                        <button key={p._id} onClick={() => handleGenerate(p._id)}
                            disabled={generating === p._id}
                            className="p-3 bg-surface/50 border border-border/30 rounded-xl text-left hover:border-primary/30 transition-all disabled:opacity-50">
                            <p className="text-sm font-medium text-text truncate">{p.name}</p>
                            <p className="text-xs text-text-muted">{p.stockLevel} in stock</p>
                            {generating === p._id && <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mt-1" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Forecast Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {forecasts.map((f, i) => {
                    const demandPct = f.currentStock > 0 ? Math.round((f.predictedDemand / f.currentStock) * 100) : 0;
                    const isRisk = f.predictedDemand > (f.currentStock || 0);

                    return (
                        <div key={i} className={`glass-card p-6 ${isRisk ? 'border-warning/30' : ''}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-text">{f.productId?.name || 'Product'}</h3>
                                    <p className="text-xs text-text-muted">{f.forecastRange}-day forecast</p>
                                </div>
                                <span className={`text-sm font-bold ${isRisk ? 'text-warning' : 'text-success'}`}>
                                    {f.confidenceScore ? `${(f.confidenceScore * 100).toFixed(0)}%` : '—'} confidence
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center p-3 bg-surface/50 rounded-xl">
                                    <p className="text-lg font-bold text-text">{f.predictedDemand}</p>
                                    <p className="text-xs text-text-muted">Predicted Demand</p>
                                </div>
                                <div className="text-center p-3 bg-surface/50 rounded-xl">
                                    <p className="text-lg font-bold text-text">{f.currentStock || f.productId?.stockLevel || '—'}</p>
                                    <p className="text-xs text-text-muted">Current Stock</p>
                                </div>
                                <div className="text-center p-3 bg-surface/50 rounded-xl">
                                    <p className={`text-lg font-bold ${f.recommendedStockIncrease > 0 ? 'text-warning' : 'text-success'}`}>
                                        +{f.recommendedStockIncrease}
                                    </p>
                                    <p className="text-xs text-text-muted">Increase Needed</p>
                                </div>
                            </div>

                            {/* Demand vs Stock bar */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs text-text-muted mb-1">
                                    <span>Demand vs Stock</span>
                                    <span>{demandPct}%</span>
                                </div>
                                <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${demandPct > 100 ? 'bg-danger' : demandPct > 70 ? 'bg-warning' : 'bg-success'}`}
                                        style={{ width: `${Math.min(100, demandPct)}%` }} />
                                </div>
                            </div>

                            <p className="text-sm text-text-muted">{f.reason}</p>
                        </div>
                    );
                })}
            </div>

            {forecasts.length === 0 && (
                <div className="glass-card p-12 text-center">
                    <HiOutlineTrendingUp className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-muted">No forecasts yet. Click on a product above to generate one.</p>
                </div>
            )}
        </div>
    );
}
