import { useState, useEffect } from 'react';
import { getAlerts, markAlertRead, markAllAlertsRead, getProducts } from '../api';
import toast from 'react-hot-toast';
import { 
    HiOutlineBell, 
    HiOutlineCheck, 
    HiOutlineExclamation, 
    HiOutlineTrendingDown, 
    HiOutlineShoppingCart,
    HiOutlineLightBulb
} from 'react-icons/hi';
import AskAIButton from '../components/AskAIButton';

const typeIcons = {
    price_drop: HiOutlineTrendingDown,
    stockout_risk: HiOutlineExclamation,
    competitor_undercut: HiOutlineTrendingDown,
    competitor_stockout: HiOutlineShoppingCart,
    promotion: HiOutlineShoppingCart,
    reorder: HiOutlineShoppingCart,
    recommendation: HiOutlineLightBulb,
    demand: HiOutlineTrendingDown,
};

const typeColors = {
    price_drop: 'text-accent bg-accent/10 border-accent/20',
    stockout_risk: 'text-danger bg-danger/10 border-danger/20',
    competitor_undercut: 'text-warning bg-warning/10 border-warning/20',
    competitor_stockout: 'text-success bg-success/10 border-success/20',
    promotion: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    reorder: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    recommendation: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    demand: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
};

export default function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [products, setProducts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        Promise.all([
            getAlerts().then(r => setAlerts(r.data)),
            getProducts().then(r => setProducts(r.data.data || r.data))
        ]).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await markAlertRead(id);
            setAlerts(prev => prev.map(a => a._id === id ? { ...a, read: true } : a));
        } catch { /* intentionally empty */ }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAlertsRead();
            setAlerts(prev => prev.map(a => ({ ...a, read: true })));
            toast.success('All alerts marked as read');
        } catch { /* intentionally empty */ }
    };

    const filtered = filter === 'all' ? alerts :
        filter === 'unread' ? alerts.filter(a => !a.read) :
            alerts.filter(a => a.type === filter);

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="w-12 h-12 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );

    const unreadCount = alerts.filter(a => !a.read).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Alerts &amp; Incident Feed</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm flex items-center gap-2">
                        {unreadCount > 0 ? (
                            <>
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{unreadCount} unread incidents</span>
                            </>
                        ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">All alerts resolved &amp; clear</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <AskAIButton
                        variant="button"
                        label="Ask AI Incident Plan"
                        prompt={`Analyze the ${alerts.length} alerts logged across our store (${unreadCount} unread). Provide an immediate tactical mitigation checklist.`}
                    />
                    {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="btn-secondary flex items-center gap-2 cursor-pointer">
                            <HiOutlineCheck className="w-4 h-4" /> Mark All Read
                        </button>
                    )}
                </div>
            </div>

            {products && products.length === 0 ? (
                <div className="glass-card p-12 flex flex-col items-center justify-center text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <HiOutlineBell className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-text mb-3">No Alerts Yet</h2>
                    <p className="text-text-muted max-w-md mx-auto mb-8">
                        You haven't added any products yet, so there's nothing to monitor. Add a product and we'll notify you of price drops, stockouts, and competitor actions.
                    </p>
                    <a href="/dashboard/products" className="btn-primary">
                        Add Your First Product
                    </a>
                </div>
            ) : (
                <>
                    {/* Filters */}
                    <div className="flex gap-2 flex-wrap animate-slide-up" style={{ animationDelay: '0.05s' }}>
                        {['all', 'unread', 'competitor_undercut', 'stockout_risk', 'competitor_stockout', 'promotion'].map(f => (
                            <button 
                                key={f} 
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all uppercase tracking-wider cursor-pointer ${
                                    filter === f
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-500'
                                        : 'bg-slate-100/90 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 dark:bg-[#131b2e] dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/80 dark:border-slate-800'
                                }`}
                            >
                                {f === 'all' ? `All (${alerts.length})` : f === 'unread' ? `Unread (${unreadCount})` : f.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Alert List */}
                    <div className="space-y-3">
                        {filtered.map((alert, i) => {
                            const Icon = typeIcons[alert.type] || HiOutlineBell;
                            const colorClass = typeColors[alert.type] || 'text-slate-400 bg-slate-800/50 border-slate-700/50';

                            return (
                                <div 
                                    key={alert._id}
                                    className={`glass-card p-5 flex items-start gap-4 transition-all animate-slide-up ${
                                        !alert.read 
                                            ? 'ring-1 ring-indigo-500/40 bg-indigo-50/40 dark:bg-indigo-950/15' 
                                            : 'opacity-80 hover:opacity-100'
                                    }`}
                                    style={{ animationDelay: `${0.1 + i * 0.03}s` }}
                                >
                                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${colorClass} ${!alert.read && alert.severity === 'critical' ? 'animate-pulse' : ''}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{alert.title}</h3>
                                            <div className="flex items-center gap-2 shrink-0 ml-4">
                                                <span className={`badge ${
                                                    alert.severity === 'critical' ? 'badge-danger' :
                                                        alert.severity === 'high' ? 'badge-warning' :
                                                            alert.severity === 'medium' ? 'badge-info' : 'badge-success'
                                                }`}>{alert.severity}</span>
                                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                                    {new Date(alert.timestamp || alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{alert.message}</p>
                                        {alert.productId && (
                                            <p className="text-[11px] text-indigo-400 font-medium mt-1 uppercase tracking-wider">
                                                SKU: {alert.productId.sku || alert.productId.name || '—'}
                                            </p>
                                        )}
                                        <div className="mt-3 flex items-center gap-2">
                                            <AskAIButton
                                                variant="chip"
                                                label="Ask Copilot Response Plan"
                                                prompt={`Advise on resolving alert: "${alert.title}" - ${alert.message}. Severity: ${alert.severity}, Type: ${alert.type}.`}
                                                contextData={{ alert }}
                                            />
                                        </div>
                                    </div>
                                    {!alert.read && (
                                        <button 
                                            onClick={() => handleMarkRead(alert._id)}
                                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all shrink-0 cursor-pointer border border-transparent hover:border-slate-700"
                                            title="Mark as read"
                                        >
                                            <HiOutlineCheck className="w-4 h-4 text-emerald-400" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {filtered.length === 0 && (
                        <div className="glass-card p-12 text-center text-slate-400">
                            <HiOutlineBell className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                            <h3 className="text-base font-bold text-white mb-1">No alerts matching filter</h3>
                            <p className="text-xs text-slate-400">All alerts in this category are resolved.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
