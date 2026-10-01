import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getRecommendations, getAlerts, getChartData } from '../api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
    HiOutlineCube, 
    HiOutlineCurrencyDollar, 
    HiOutlineTrendingUp, 
    HiOutlineExclamation, 
    HiOutlineLightBulb, 
    HiOutlineChartBar,
    HiOutlineSparkles,
    HiOutlineShieldCheck,
    HiOutlineShoppingBag,
    HiOutlineLightningBolt,
    HiOutlineGlobeAlt
} from 'react-icons/hi';
import { SiAmazon, SiShopify, SiWoocommerce } from 'react-icons/si';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import WhatIfSimulator from '../components/WhatIfSimulator';
import { SkeletonCard, SkeletonTable } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import AskAIButton from '../components/AskAIButton';
import MobileHeroCards from '../components/MobileHeroCards';
import { warmupAIService } from '../utils/aiWarmup';
import PricePilotChartLoader from '../components/PricePilotChartLoader';

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
        warmupAIService();
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
                <PricePilotChartLoader size="medium" message="Loading your business data..." showDelay={700} onRetry={fetchData} className="py-2 mb-4" />
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
    const { user } = useAuth();
    const onboarding = user?.onboarding;

    const goalTitles = {
        profit: 'Maximize Profit Margins',
        sales_velocity: 'Accelerate Sales Velocity & Volume',
        clear_inventory: 'Liquidate Aging & Excess Stock',
        competitor_defense: 'Win Buy Box & Defend Market Share',
        price_testing: 'Algorithmic Price Elasticity Testing',
    };

    const primaryGoalKey = onboarding?.goals?.[0] || 'profit';
    const primaryGoalTitle = goalTitles[primaryGoalKey] || 'Profit & Revenue Growth';

    const statCards = [
        { label: 'Inventory Value', value: formatCurrency(stats?.inventoryValue || stats?.totalRevenue || 0), icon: HiOutlineCurrencyDollar, iconBg: 'bg-[#5F806B]/15 text-[#5F806B] dark:text-[#7FA38B]', topAccent: 'border-t-2 border-t-[#5F806B]', change: null },
        { label: 'Products', value: stats?.totalProducts || 0, icon: HiOutlineCube, iconBg: 'bg-primary/15 text-primary dark:text-[#C57A5A]', topAccent: 'border-t-2 border-t-primary', change: null },
        { label: 'Avg Margin', value: `${stats?.avgMargin || 0}%`, icon: HiOutlineTrendingUp, iconBg: 'bg-[#B8734F]/15 text-[#B8734F] dark:text-[#D4936F]', topAccent: 'border-t-2 border-t-[#B8734F]', change: null },
        { label: 'Low Stock Items', value: stats?.lowStockProducts || 0, icon: HiOutlineExclamation, iconBg: 'bg-[#A17A3A]/15 text-[#A17A3A] dark:text-[#C49B55]', topAccent: 'border-t-2 border-t-[#A17A3A]', change: null },
        { label: 'AI Suggestions', value: stats?.pendingRecommendations || 0, icon: HiOutlineLightBulb, iconBg: 'bg-primary/15 text-primary dark:text-[#C57A5A]', topAccent: 'border-t-2 border-t-primary', change: `${stats?.acceptedRecommendations || 0} accepted` },
    ];

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Mobile Hero Action Cards, Quick Squircles & Scratch Pad (Direct match to reference image) */}
            <div className="md:hidden">
                <MobileHeroCards stats={stats} />
            </div>

            {/* Desktop Top Header */}
            <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
                <div>
                    <h1 className="page-header text-3xl font-extrabold text-text tracking-tight">Executive Dashboard</h1>
                    <p className="text-text-muted mt-1 text-sm">Autonomous dynamic pricing &amp; inventory intelligence command center</p>
                </div>
                <AskAIButton
                    variant="button"
                    label="Ask AI Store Audit"
                    prompt={`Provide an executive summary of our store health: Total catalog value is ${formatCurrency(stats?.inventoryValue || 0)} across ${stats?.totalProducts || 0} products with ${stats?.avgMargin || 0}% average margin and ${stats?.lowStockProducts || 0} low stock items. What actions should I prioritize today?`}
                    contextData={{ stats }}
                />
            </div>

            {/* Personalized AI Pricing Mission & Channel Status Bar */}
            {onboarding?.completed ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-surface to-primary/5 border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs animate-fade-in">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 shadow-inner">
                            <HiOutlineSparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Pilot Active</span>
                                <span className="text-xs text-text-muted">•</span>
                                <span className="text-xs font-extrabold text-text">{primaryGoalTitle}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-text-muted flex-wrap">
                                <span>Channels:</span>
                                {onboarding.channels?.map((ch) => (
                                    <span key={ch} className="px-2 py-0.5 rounded-md bg-surface-elevated border border-border text-[10px] font-bold text-text uppercase">
                                        {ch}
                                    </span>
                                ))}
                                <span className="text-[11px] text-text-muted">| Strategy: <strong className="text-text">{user?.preferences?.pricingStrategy?.replace('_', ' ').toUpperCase() || 'SMART UNDERCUT'}</strong></span>
                                <span className="text-[11px] text-[#5F806B] dark:text-[#7FA38B] font-semibold">({user?.preferences?.minMarginFloor || 20}% Margin Floor)</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                        <Link
                            to="/dashboard/integrations"
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-text transition-colors"
                        >
                            Sync Channels →
                        </Link>
                        <Link
                            to="/dashboard/settings"
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary transition-colors"
                        >
                            Tune AI Rules
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-primary/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
                            <HiOutlineSparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-text">Calibrate Your AI Pricing Pilot</div>
                            <p className="text-[11px] text-text-muted">Tell us your selling channels, target margin floors, and growth aims for personalized repricing.</p>
                        </div>
                    </div>
                    <Link
                        to="/onboarding"
                        className="btn-primary py-2 px-4 text-xs font-bold whitespace-nowrap self-start sm:self-auto"
                    >
                        Complete 2-Min Setup →
                    </Link>
                </div>
            )}

            {/* Quick AI Analytical Inquiry Chips */}
            <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-2.5">
                    <HiOutlineLightBulb className="w-4 h-4 text-primary" />
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
                                    <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                                        <card.icon className="w-5 h-5" />
                                    </div>
                                    {card.change && (
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-text-muted bg-surface-elevated border border-border">
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
                                                    <stop offset="5%" stopColor="#A85A3C" stopOpacity={0.35} />
                                                    <stop offset="95%" stopColor="#A85A3C" stopOpacity={0.02} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--pp-border)" strokeOpacity={0.5} />
                                            <XAxis dataKey="day" tick={{ fill: 'var(--pp-text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--pp-border)' }} />
                                            <YAxis tick={{ fill: 'var(--pp-text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--pp-border)' }} domain={[0, 1]} />
                                            <Tooltip contentStyle={{ background: 'var(--pp-surface)', border: '1px solid var(--pp-border)', borderRadius: '12px', color: 'var(--pp-text)', boxShadow: '0 12px 28px rgba(0,0,0,0.15)' }} />
                                            <Area type="monotone" dataKey="demandScore" stroke="#A85A3C" fill="url(#demandGrad)" strokeWidth={2.5} name="Demand Score" />
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
                                <div className="w-8 h-8 rounded-lg bg-[#B8734F]/15 flex items-center justify-center">
                                    <HiOutlineTrendingUp className="w-4 h-4 text-[#B8734F] dark:text-[#D4936F]" />
                                </div>
                                <h2 className="text-base font-semibold text-text">Search Trend &amp; Signals</h2>
                            </div>
                            <div className="chart-container">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={chartData}>
                                            <defs>
                                                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#B8734F" stopOpacity={0.9} />
                                                    <stop offset="100%" stopColor="#B8734F" stopOpacity={0.4} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--pp-border)" strokeOpacity={0.5} />
                                            <XAxis dataKey="day" tick={{ fill: 'var(--pp-text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--pp-border)' }} />
                                            <YAxis tick={{ fill: 'var(--pp-text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--pp-border)' }} />
                                            <Tooltip contentStyle={{ background: 'var(--pp-surface)', border: '1px solid var(--pp-border)', borderRadius: '12px', color: 'var(--pp-text)', boxShadow: '0 12px 28px rgba(0,0,0,0.15)' }} />
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
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <HiOutlineLightBulb className="w-4 h-4 text-primary" />
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
                                    <div key={i} className="p-3.5 bg-surface-elevated/70 rounded-xl border border-border hover:border-primary/40 transition-all">
                                        <div className="flex items-start justify-between mb-1">
                                            <p className="text-sm font-medium text-text">{rec.productId?.name || 'Product'}</p>
                                            <span className="badge-info text-[10px]">
                                                {Math.round((rec.confidenceScore != null ? rec.confidenceScore : 0.85) * 100)}%
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-muted line-clamp-2">
                                            {(() => {
                                                let summary = null;
                                                if (typeof rec.insight === 'object' && rec.insight !== null) {
                                                    summary = rec.insight.summary;
                                                } else if (typeof rec.insight === 'string') {
                                                    try {
                                                        const parsed = JSON.parse(rec.insight);
                                                        summary = parsed?.summary;
                                                    } catch {
                                                        summary = rec.insight;
                                                    }
                                                }
                                                return String(summary || rec.reason || 'AI price optimization computed.');
                                            })()}
                                        </p>
                                        <div className="flex items-center justify-between gap-3 mt-2 text-xs">
                                            <div className="flex items-center gap-3">
                                                <span className="text-text-muted">Current: {formatCurrency(rec.currentPrice)}</span>
                                                <span className="text-primary font-semibold">→ {formatCurrency(rec.recommendedPrice)}</span>
                                                <span className={rec.expectedRevenueImpact > 0 ? 'text-[#5F806B] dark:text-[#7FA38B] font-semibold' : 'text-danger font-semibold'}>
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
                                    <div key={i} className={`p-3.5 rounded-xl border transition-all ${alert.severity === 'critical' ? 'bg-danger/5 border-danger/25' :
                                            alert.severity === 'high' ? 'bg-warning/5 border-warning/25' :
                                                'bg-surface-elevated/70 border-border'
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
