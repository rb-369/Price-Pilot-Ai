import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { 
    HiOutlineTrendingUp, 
    HiOutlineCube, 
    HiOutlineCurrencyDollar, 
    HiOutlineDownload, 
    HiOutlineRefresh,
    HiOutlineChartBar,
    HiOutlineLightBulb
} from 'react-icons/hi';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api';
import toast from 'react-hot-toast';
import BulkSalesImportModal from '../components/BulkSalesImportModal';
import AskAIButton from '../components/AskAIButton';

export default function Analytics() {
    const { formatCurrency, config } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);
    const [data, setData] = useState({
        totalRevenue: 0,
        totalUnitsSold: 0,
        topProducts: [],
        trend: []
    });
    const [showImport, setShowImport] = useState(false);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await api.get('/sales/analytics');
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load analytics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const handleSimulate = async () => {
        try {
            setSimulating(true);
            const toastId = toast.loading('Simulating 30 days of synthetic sales data...');
            const res = await api.post('/sales/simulate');
            toast.success(res.data.message || 'Simulation complete', { id: toastId });
            fetchAnalytics(); // Refresh
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to simulate sales.');
        } finally {
            setSimulating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Sales &amp; Revenue Analytics</h1>
                    <p className="mt-1 text-sm text-slate-400">Track revenue elasticity, velocity curves, and volume drivers.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <AskAIButton
                        variant="button"
                        label="Ask AI to Analyze Trends"
                        prompt={`Analyze our 30-day store performance: Total revenue is ${formatCurrency(data.totalRevenue)} with ${data.totalUnitsSold} units sold across ${data.topProducts.length} top products. Provide key takeaways on margin health and revenue opportunities.`}
                        contextData={{ totalRevenue: data.totalRevenue, unitsSold: data.totalUnitsSold, topProducts: data.topProducts }}
                    />
                    <button onClick={handleSimulate} disabled={simulating} className="btn-secondary flex items-center gap-2 disabled:opacity-50 cursor-pointer">
                        <HiOutlineRefresh className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
                        Simulate Data
                    </button>
                    <button onClick={() => setShowImport(true)} className="btn-primary flex items-center gap-2 cursor-pointer">
                        <HiOutlineDownload className="w-4 h-4" />
                        Import Sales
                    </button>
                </div>
            </div>

            {/* Contextual AI Prompt Chips */}
            <div className="p-4 rounded-2xl bg-[#0d1326] border border-indigo-500/20 shadow-md">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2.5">
                    <HiOutlineLightBulb className="w-4 h-4 text-amber-400" />
                    Recommended Analytical Inquiries
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <AskAIButton
                        variant="quick-prompt"
                        label="Which products have the highest elasticity margin upside?"
                        prompt="Identify which products in our catalog have the highest price elasticity upside without harming transaction conversion rates."
                    />
                    <AskAIButton
                        variant="quick-prompt"
                        label="Explain recent weekend revenue velocity shifts"
                        prompt="Analyze our 30-day daily sales trend and explain whether weekend spikes or mid-week dips suggest promotional opportunity."
                    />
                    <AskAIButton
                        variant="quick-prompt"
                        label="Forecast next month's SKU inventory turnover"
                        prompt="Based on our current sales velocity, simulate which inventory SKUs are likely to face stockout or overstock risks."
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="glass-card p-5 h-32 animate-pulse bg-surface/50" />
                    ))}
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                        <div className="glass-card p-6 border-l-4 border-l-emerald-500">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <HiOutlineCurrencyDollar className="w-5 h-5" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue (30d)</h3>
                            </div>
                            <p className="text-3xl font-extrabold text-white mt-2">{formatCurrency(data.totalRevenue)}</p>
                        </div>
                        <div className="glass-card p-6 border-l-4 border-l-indigo-500">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    <HiOutlineCube className="w-5 h-5" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Units Sold (30d)</h3>
                            </div>
                            <p className="text-3xl font-extrabold text-white mt-2">{data.totalUnitsSold}</p>
                        </div>
                    </div>

                    {/* Chart & Top Products */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="glass-card p-6 lg:col-span-2">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                                    <HiOutlineChartBar className="text-emerald-400" />
                                    Revenue Trend Timeline
                                </h3>
                                <span className="text-xs text-slate-400">Daily Trajectory</span>
                            </div>
                            <div className="h-72 w-full">
                                {data.trend.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#818cf8' }} dy={10} minTickGap={30} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#818cf8' }} tickFormatter={(val) => `${config.symbol}${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`} />
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: '#0d1326', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#fff' }}
                                                formatter={(value) => [formatCurrency(value), 'Revenue']}
                                                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                            />
                                            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                                        <HiOutlineTrendingUp className="w-12 h-12 mb-2 opacity-50" />
                                        <p>No sales data available. Import or simulate sales.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="glass-card p-6">
                            <h3 className="text-base font-bold text-white mb-4 tracking-tight">Top Volume Drivers</h3>
                            {data.topProducts.length > 0 ? (
                                <div className="space-y-4">
                                    {data.topProducts.map((prod, idx) => (
                                        <div key={prod._id || idx} className="flex items-center justify-between group p-2 rounded-xl hover:bg-slate-800/40 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="flex w-7 h-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-300">
                                                    {idx + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-white truncate max-w-[140px]" title={prod.name}>{prod.name}</p>
                                                    <p className="text-[10px] text-slate-400">{prod.category || 'General'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-extrabold text-emerald-400">{formatCurrency(prod.revenue)}</p>
                                                <AskAIButton
                                                    variant="icon-button"
                                                    prompt={`Analyze sales performance and pricing elasticity for top selling product: ${prod.name} (Revenue: ₹${prod.revenue}).`}
                                                    contextData={{ productName: prod.name, revenue: prod.revenue }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
                                    No products found.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {showImport && (
                <BulkSalesImportModal 
                    onClose={() => setShowImport(false)} 
                    onSuccess={() => { setShowImport(false); fetchAnalytics(); }}
                />
            )}
        </div>
    );
}
