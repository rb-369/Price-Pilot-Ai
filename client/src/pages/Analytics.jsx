import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { HiOutlineTrendingUp, HiOutlineCube, HiOutlineCurrencyDollar, HiOutlineDownload, HiOutlineRefresh } from 'react-icons/hi';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api';
import toast from 'react-hot-toast';
import BulkSalesImportModal from '../components/BulkSalesImportModal';

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
            const res = await api.get('/api/sales/analytics');
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
            const res = await api.post('/api/sales/simulate');
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text">Sales Analytics</h1>
                    <p className="mt-1 text-sm text-text-muted">Track revenue, monitor performance, and analyze sales trends.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSimulate} disabled={simulating} className="btn btn-secondary flex items-center gap-2 disabled:opacity-50">
                        <HiOutlineRefresh className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
                        Simulate Data
                    </button>
                    <button onClick={() => setShowImport(true)} className="btn btn-primary flex items-center gap-2">
                        <HiOutlineDownload className="w-4 h-4" />
                        Import Sales
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="card p-5 h-32 animate-pulse bg-surface/50" />
                    ))}
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><HiOutlineCurrencyDollar className="w-5 h-5" /></div>
                                <h3 className="text-sm font-semibold text-text-muted">Total Revenue (30d)</h3>
                            </div>
                            <p className="text-3xl font-bold text-text mt-2">{formatCurrency(data.totalRevenue)}</p>
                        </div>
                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500"><HiOutlineCube className="w-5 h-5" /></div>
                                <h3 className="text-sm font-semibold text-text-muted">Total Units Sold (30d)</h3>
                            </div>
                            <p className="text-3xl font-bold text-text mt-2">{data.totalUnitsSold}</p>
                        </div>
                    </div>

                    {/* Chart & Top Products */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="card p-6 lg:col-span-2">
                            <h3 className="text-lg font-semibold text-text mb-6">Revenue Trend</h3>
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
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#818cf8' }} tickFormatter={(val) => \`\${config.symbol}\${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}\`} />
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                formatter={(value) => [formatCurrency(value), 'Revenue']}
                                                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                            />
                                            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-text-muted">
                                        <HiOutlineTrendingUp className="w-12 h-12 mb-2 opacity-50" />
                                        <p>No sales data available. Import or simulate sales.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-text mb-4">Top 5 Products</h3>
                            {data.topProducts.length > 0 ? (
                                <div className="space-y-4">
                                    {data.topProducts.map((prod, idx) => (
                                        <div key={prod._id} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="flex w-6 h-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                    {idx + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-text truncate max-w-[150px]" title={prod.name}>{prod.name}</p>
                                                    <p className="text-xs text-text-muted">{prod.category || 'General'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-emerald-400">{formatCurrency(prod.revenue)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-text-muted text-sm">
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
