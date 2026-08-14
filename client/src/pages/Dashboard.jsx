import { useState, useEffect } from 'react';
import { getDashboardStats, getRecommendations, getAlerts, getChartData } from '../api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
    HiOutlineCube, 
    HiOutlineCurrencyDollar, 
    HiOutlineTrendingUp, 
    HiOutlineExclamation, 
    HiOutlineLightBulb, 
    HiOutlineChartBar 
} from 'react-icons/hi';
import { useCurrency } from '../context/CurrencyContext';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import WhatIfSimulator from '../components/WhatIfSimulator';
import { SkeletonCard, SkeletonTable } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import AskAIButton from '../components/AskAIButton';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchData = () => {
        setLoading(true);
        setError(false);
        Promise.all([
            getDashboardStats().then(r => setStats(r.data)).catch(() => { throw new Error('Stats failed') }),
            getRecommendations().then(r => {
                const data = r.data.data || r.data;
                setRecommendations(Array.isArray(data) ? data.slice(0, 5) : []);
            }).catch(() => { }),
            getAlerts().then(r => setAlerts(r.data.slice(0, 5))).catch(() => { }),
            getChartData(30).then(r => setChartData(r.data)).catch(() => setChartData([])),
        ]).catch(() => {
            setError(true);
        }).finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (error) {
        return <ErrorState title="Failed to load Dashboard" onRetry={fetchData} />;
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-end mb-8">
                    <div><div className="skeleton h-8 w-48 mb-2 rounded"></div><div className="skeleton h-4 w-64 rounded"></div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkeletonTable rows={5} columns={3} />
                    <SkeletonTable rows={5} columns={3} />
                </div>
            </div>
        );
    }

    const { formatCurrency } = useCurrency();

    const statCards = [
        { label: 'Inventory Value', value: formatCurrency(stats?.inventoryValue || stats?.totalRevenue || 0), icon: HiOutlineCurrencyDollar, gradient: 'from-green-500 to-emerald-600', topAccent: 'border-t-2 border-t-emerald-500', change: null },
        { label: 'Products', value: stats?.totalProducts || 0, icon: HiOutlineCube, gradient: 'from-primary to-primary-dark', topAccent: 'border-t-2 border-t-primary', change: null },
        { label: 'Avg Margin', value: `${stats?.avgMargin || 0}%`, icon: HiOutlineTrendingUp, gradient: 'from-accent to-cyan-600', topAccent: 'border-t-2 border-t-accent', change: null },
        { label: 'Low Stock Items', value: stats?.lowStockProducts || 0, icon: HiOutlineExclamation, gradient: 'from-warning to-orange-600', topAccent: 'border-t-2 border-t-warning', change: null },
        { label: 'AI Suggestions', value: stats?.pendingRecommendations || 0, icon: HiOutlineLightBulb, gradient: 'from-purple-500 to-violet-600', topAccent: 'border-t-2 border-t-purple-500', change: `${stats?.acceptedRecommendations || 0} accepted` },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
                <div>
                    <h1 className="page-header text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Executive Dashboard</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">Autonomous dynamic pricing &amp; inventory intelligence command center</p>
                </div>
                <AskAIButton
                    variant="button"
                    label="Ask AI Store Audit"
                    prompt={`Provide an executive summary of our store health: Total catalog value is ${formatCurrency(stats?.inventoryValue || 0)} across ${stats?.totalProducts || 0} products with ${stats?.avgMargin || 0}% average margin and ${stats?.lowStockProducts || 0} low stock items. What actions should I prioritize today?`}
                    contextData={{ stats }}
                />
            </div>

            {/* Quick AI Analytical Inquiry Chips */}
            <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-200/70 dark:bg-[#0d1326] dark:border-indigo-500/20 shadow-sm dark:shadow-md">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-2.5">
                    <HiOutlineLightBulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    AI Intelligence Inquiries
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <AskAIButton
                        variant="quick-prompt"
                        label="Analyze catalog pricing elasticity & margin opportunities"
                        prompt="Audit our catalog margins and highlight products where price increases would deliver immediate profit growth."
                    />
                    <AskAIButton
                        variant="quick-prompt"
                        label="Identify critical inventory stockout vulnerabilities"
                        prompt="Which products in our catalog are approaching depletion thresholds and need urgent supplier reorders?"
                    />
                    <AskAIButton
                        variant="quick-prompt"
                        label="Evaluate pending algorithmic price recommendations"
                        prompt="Summarize the pending AI pricing recommendations and explain the primary elasticity drivers behind them."
                    />
                </div>
            </div>

            {stats?.totalProducts === 0 ? (
                <div className="glass-card p-12 flex flex-col items-center justify-center text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <HiOutlineCube className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-text mb-3">Welcome to PricePilot!</h2>
                    <p className="text-text-muted max-w-md mx-auto mb-8">
                        Your dashboard is currently empty. Get started by adding your first product so our AI can begin tracking competitor prices, analyzing demand signals, and generating smart recommendations.
                    </p>
                    <a href="/dashboard/products" className="btn-primary">
                        Add Your First Product
                    </a>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {statCards.map((card, i) => (
                            <div key={i} className={`glass-card-hover p-5 ${card.topAccent} animate-slide-up`}
                                style={{ animationDelay: `${i * 0.08}s` }}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
                                        <card.icon className="w-5 h-5 text-white" />
                                    </div>
                                    {card.change && (
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-text-muted bg-surface-lighter/50">
                                            {card.change}
                                        </span>
                                    )}
                                </div>
                                <p className="text-2xl font-bold text-text tracking-tight">{card.value}</p>
                                <p className="text-xs text-text-muted mt-0.5 uppercase tracking-wider">{card.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Charts Row — Demand Trend & Search Trend Signals */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Demand Trend */}
                        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <HiOutlineChartBar className="w-4 h-4 text-primary" />
                                </div>
                                <h2 className="text-base font-semibold text-text">Demand Trend (30 Days)</h2>
                            </div>
                            <div className="chart-container">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                                            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} domain={[0, 1]} />
                                            <Tooltip contentStyle={{ background: '#131b2e', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', color: '#f1f5f9', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
                                            <Area type="monotone" dataKey="demandScore" stroke="#6366f1" fill="url(#demandGrad)" strokeWidth={2} name="Demand Score" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[280px] text-text-muted text-sm">
                                        No demand data yet. Add products and generate demand signals.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search Trend */}
                        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                    <HiOutlineTrendingUp className="w-4 h-4 text-accent" />
                                </div>
                                <h2 className="text-base font-semibold text-text">Search Trend &amp; Signals</h2>
                            </div>
                            <div className="chart-container">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={chartData}>
                                            <defs>
                                                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                                            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} />
                                            <Tooltip contentStyle={{ background: '#131b2e', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', color: '#f1f5f9', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
                                            <Bar dataKey="searchTrend" fill="url(#barGrad)" radius={[6, 6, 0, 0]} name="Search Trend Score" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[280px] text-text-muted text-sm">
                                        No search trend data yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* AI Powered What-If Simulator Section */}
                    <WhatIfSimulator onPriceCommitted={fetchData} />

                    {/* Explainability Panel */}
                    <div className="grid grid-cols-1 gap-6">
                        <ExplainabilityPanel xaiData={stats?.xai} recommendations={recommendations} />
                    </div>

                    {/* Recommendations & Alerts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.35s' }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                                        <HiOutlineLightBulb className="w-4 h-4 text-warning" />
                                    </div>
                                    <h2 className="text-base font-semibold text-text">Latest AI Recommendations</h2>
                                </div>
                                <AskAIButton
                                    variant="chip"
                                    label="Ask AI"
                                    prompt="Summarize our latest pricing recommendations and expected profit margins."
                                />
                            </div>
                            <div className="space-y-3">
                                {recommendations.length ? recommendations.map((rec, i) => (
                                    <div key={i} className="p-3.5 bg-surface/50 rounded-xl border border-primary/10 hover:border-primary/20 transition-all">
                                        <div className="flex items-start justify-between mb-1">
                                            <p className="text-sm font-medium text-text">{rec.productId?.name || 'Product'}</p>
                                            <span className="badge-info text-[10px]">{(rec.confidenceScore * 100).toFixed(0)}%</span>
                                        </div>
                                        <p className="text-xs text-text-muted line-clamp-2">
                                            {(() => {
                                                try {
                                                    return JSON.parse(rec.insight).summary;
                                                } catch {
                                                    return rec.insight || rec.reason;
                                                }
                                            })()}
                                        </p>
                                        <div className="flex items-center justify-between gap-3 mt-2 text-xs">
                                            <div className="flex items-center gap-3">
                                                <span className="text-text-muted">Current: {formatCurrency(rec.currentPrice)}</span>
                                                <span className="text-primary font-semibold">→ {formatCurrency(rec.recommendedPrice)}</span>
                                                <span className={rec.expectedRevenueImpact > 0 ? 'text-success' : 'text-danger'}>
                                                    {rec.expectedRevenueImpact > 0 ? '+' : ''}{rec.expectedRevenueImpact}% revenue
                                                </span>
                                            </div>
                                            <AskAIButton
                                                variant="icon-button"
                                                prompt={`Analyze recommendation for ${rec.productId?.name || 'Product'}: Change price from ₹${rec.currentPrice} to ₹${rec.recommendedPrice}.`}
                                            />
                                        </div>
                                    </div>
                                )) : <p className="text-text-muted text-sm text-center py-8">No recommendations yet</p>}
                            </div>
                        </div>

                        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
                                        <HiOutlineExclamation className="w-4 h-4 text-danger" />
                                    </div>
                                    <h2 className="text-base font-semibold text-text">Recent Alerts</h2>
                                </div>
                                <AskAIButton
                                    variant="chip"
                                    label="Ask AI"
                                    prompt="Analyze recent alerts across our store and generate an incident mitigation plan."
                                />
                            </div>
                            <div className="space-y-3">
                                {alerts.length ? alerts.map((alert, i) => (
                                    <div key={i} className={`p-3.5 rounded-xl border transition-all ${alert.severity === 'critical' ? 'bg-danger/[0.03] border-danger/20' :
                                            alert.severity === 'high' ? 'bg-warning/[0.03] border-warning/20' :
                                                'bg-surface/50 border-primary/10'
                                        }`}>
                                        <div className="flex items-start justify-between mb-1">
                                            <p className="text-sm font-medium text-text">{alert.title}</p>
                                            <span className={
                                                alert.severity === 'critical' ? 'badge-danger' :
                                                    alert.severity === 'high' ? 'badge-warning' : 'badge-info'
                                            }>{alert.severity}</span>
                                        </div>
                                        <p className="text-xs text-text-muted">{alert.message}</p>
                                    </div>
                                )) : <p className="text-text-muted text-sm text-center py-8">No alerts</p>}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
