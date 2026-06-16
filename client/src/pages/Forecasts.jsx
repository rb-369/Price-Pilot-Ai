import { useState, useEffect } from 'react';
import { getForecasts, getProducts, generateForecast } from '../api';
import toast from 'react-hot-toast';
import { HiOutlineTrendingUp, HiOutlineRefresh, HiOutlineExclamation } from 'react-icons/hi';

export default function Forecasts() {
    const [forecasts, setForecasts] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(null);

    useEffect(() => {
        Promise.all([
            getForecasts().then(r => setForecasts(r.data.data || r.data)).catch(() => { }),
            getProducts().then(r => setProducts(r.data.data || r.data)).catch(() => { }),
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

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="w-12 h-12 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="animate-slide-up">
                <h1 className="page-header text-3xl">Inventory Forecasts</h1>
                <p className="text-text-muted mt-1 text-sm">AI-powered 30–60 day demand prediction</p>
            </div>

            {/* Generate Section */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <HiOutlineRefresh className="w-4 h-4 text-accent" />
                    </div>
                    Generate New Forecast
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {products.slice(0, 10).map(p => (
                        <button key={p._id} onClick={() => handleGenerate(p._id)}
                            disabled={generating === p._id}
                            className="p-3.5 bg-[rgba(10,15,30,0.5)] border border-[rgba(99,102,241,0.06)] rounded-xl text-left hover:border-primary/25 hover:bg-[rgba(99,102,241,0.03)] transition-all disabled:opacity-50 group">
                            <p className="text-sm font-medium text-text truncate group-hover:text-primary-light transition-colors">{p.name}</p>
                            <p className="text-[11px] text-text-muted">{p.stockLevel} in stock</p>
                            {generating === p._id && <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mt-1.5" />}
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
                        <div key={i} className={`glass-card p-6 animate-slide-up ${isRisk ? 'border-warning/20' : ''}`}
                            style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {isRisk && (
                                        <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center animate-pulse">
                                            <HiOutlineExclamation className="w-4 h-4 text-warning" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-text">{f.productId?.name || 'Product'}</h3>
                                        <p className="text-[11px] text-text-muted uppercase tracking-wider">{f.forecastRange}-day forecast</p>
                                    </div>
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isRisk ? 'text-warning bg-warning/10' : 'text-success bg-success/10'}`}>
                                    {f.confidenceScore ? `${(f.confidenceScore * 100).toFixed(0)}%` : '—'} confidence
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="text-center p-3.5 bg-[rgba(10,15,30,0.5)] rounded-xl border border-[rgba(99,102,241,0.04)]">
                                    <p className="text-xl font-bold text-text">{f.predictedDemand}</p>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Predicted</p>
                                </div>
                                <div className="text-center p-3.5 bg-[rgba(10,15,30,0.5)] rounded-xl border border-[rgba(99,102,241,0.04)]">
                                    <p className="text-xl font-bold text-text">{f.currentStock || f.productId?.stockLevel || '—'}</p>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Stock</p>
                                </div>
                                <div className="text-center p-3.5 bg-[rgba(10,15,30,0.5)] rounded-xl border border-[rgba(99,102,241,0.04)]">
                                    <p className={`text-xl font-bold ${f.recommendedStockIncrease > 0 ? 'text-warning' : 'text-success'}`}>
                                        +{f.recommendedStockIncrease}
                                    </p>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Increase</p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-3">
                                <div className="flex justify-between text-[11px] text-text-muted mb-1.5">
                                    <span>Demand vs Stock</span>
                                    <span className="font-medium">{demandPct}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div className={`progress-fill ${demandPct > 100 ? 'bg-gradient-to-r from-danger to-red-400' : demandPct > 70 ? 'bg-gradient-to-r from-warning to-amber-400' : 'bg-gradient-to-r from-success to-emerald-400'}`}
                                        style={{ width: `${Math.min(100, demandPct)}%` }} />
                                </div>
                            </div>

                            <p className="text-xs text-text-muted leading-relaxed">{f.reason}</p>
                        </div>
                    );
                })}
            </div>

            {forecasts.length === 0 && (
                <div className="glass-card empty-state">
                    <HiOutlineTrendingUp className="empty-state-icon w-16 h-16" />
                    <h3 className="text-lg font-semibold text-text mb-1">No forecasts yet</h3>
                    <p className="text-text-muted text-sm">Click on a product above to generate one</p>
                </div>
            )}
        </div>
    );
}
