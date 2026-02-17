import { useState, useEffect } from 'react';
import { getDashboardStats, getRecommendations, getAlerts } from '../api';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HiOutlineCube, HiOutlineCurrencyRupee, HiOutlineTrendingUp, HiOutlineExclamation, HiOutlineLightBulb, HiOutlineChartBar } from 'react-icons/hi';

const mockRevenueData = Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    revenue: Math.round(50000 + Math.random() * 30000 + i * 500),
    orders: Math.round(50 + Math.random() * 40 + i * 2),
}));

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getDashboardStats().then(r => setStats(r.data)).catch(() => setStats({
                totalProducts: 10, lowStockProducts: 3, pendingRecommendations: 5,
                totalRevenue: 125000, avgMargin: '28.5',
            })),
            getRecommendations().then(r => setRecommendations(r.data.slice(0, 5))).catch(() => { }),
            getAlerts().then(r => setAlerts(r.data.slice(0, 5))).catch(() => { }),
        ]).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
    );

    const statCards = [
        { label: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: HiOutlineCurrencyRupee, color: 'from-green-500 to-emerald-600', change: '+12.5%' },
        { label: 'Products', value: stats?.totalProducts || 0, icon: HiOutlineCube, color: 'from-primary to-primary-dark', change: null },
        { label: 'Avg Margin', value: `${stats?.avgMargin || 0}%`, icon: HiOutlineTrendingUp, color: 'from-accent to-cyan-600', change: '+2.1%' },
        { label: 'Low Stock Items', value: stats?.lowStockProducts || 0, icon: HiOutlineExclamation, color: 'from-warning to-orange-600', change: null },
        { label: 'AI Suggestions', value: stats?.pendingRecommendations || 0, icon: HiOutlineLightBulb, color: 'from-purple-500 to-violet-600', change: 'pending' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="page-header text-3xl">Dashboard</h1>
                <p className="text-text-muted mt-1">AI-Powered Pricing & Inventory Intelligence</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className="glass-card-hover p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                                <card.icon className="w-5 h-5 text-white" />
                            </div>
                            {card.change && (
                                <span className={`text-xs font-medium ${card.change.startsWith('+') ? 'text-success' : 'text-text-muted'}`}>
                                    {card.change}
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-text">{card.value}</p>
                        <p className="text-sm text-text-muted">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <HiOutlineChartBar className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-text">Revenue Trend (30 Days)</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={mockRevenueData}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revenueGrad)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Orders Chart */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <HiOutlineTrendingUp className="w-5 h-5 text-accent" />
                        <h2 className="text-lg font-semibold text-text">Daily Orders</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={mockRevenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }} />
                            <Bar dataKey="orders" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recommendations & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <HiOutlineLightBulb className="w-5 h-5 text-warning" />
                        <h2 className="text-lg font-semibold text-text">Latest AI Recommendations</h2>
                    </div>
                    <div className="space-y-3">
                        {recommendations.length ? recommendations.map((rec, i) => (
                            <div key={i} className="p-3 bg-surface/50 rounded-xl border border-border/30">
                                <div className="flex items-start justify-between mb-1">
                                    <p className="text-sm font-medium text-text">{rec.productId?.name || 'Product'}</p>
                                    <span className="badge-info">{(rec.confidenceScore * 100).toFixed(0)}%</span>
                                </div>
                                <p className="text-xs text-text-muted line-clamp-2">{rec.reason}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs">
                                    <span className="text-text-muted">Current: ₹{rec.currentPrice}</span>
                                    <span className="text-primary font-medium">→ ₹{rec.recommendedPrice}</span>
                                    <span className={rec.expectedRevenueImpact > 0 ? 'text-success' : 'text-danger'}>
                                        {rec.expectedRevenueImpact > 0 ? '+' : ''}{rec.expectedRevenueImpact}% revenue
                                    </span>
                                </div>
                            </div>
                        )) : <p className="text-text-muted text-sm">No recommendations yet</p>}
                    </div>
                </div>

                <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <HiOutlineExclamation className="w-5 h-5 text-danger" />
                        <h2 className="text-lg font-semibold text-text">Recent Alerts</h2>
                    </div>
                    <div className="space-y-3">
                        {alerts.length ? alerts.map((alert, i) => (
                            <div key={i} className={`p-3 rounded-xl border ${alert.severity === 'critical' ? 'bg-danger/5 border-danger/30' :
                                    alert.severity === 'high' ? 'bg-warning/5 border-warning/30' :
                                        'bg-surface/50 border-border/30'
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
                        )) : <p className="text-text-muted text-sm">No alerts</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
