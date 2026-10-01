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
import PricePilotChartLoader from '../components/PricePilotChartLoader';

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
    price_drop: 'text-copper bg-copper/10 border-copper/20',
    stockout_risk: 'text-danger bg-danger/10 border-danger/20',
    competitor_undercut: 'text-brass bg-brass/10 border-brass/20',
    competitor_stockout: 'text-sage bg-sage/10 border-sage/20',
    promotion: 'text-primary bg-primary/10 border-primary/20',
    reorder: 'text-copper bg-copper/10 border-copper/20',
    recommendation: 'text-sage bg-sage/10 border-sage/20',
    demand: 'text-brass bg-brass/10 border-brass/20',
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
        <PricePilotChartLoader
            size="medium"
            message="Loading alerts & incidents..."
            onRetry={fetchAlerts}
            className="h-96"
        />
    );

    const unreadCount = alerts.filter(a => !a.read).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text">Alerts &amp; Incident Feed</h1>
                    <p className="text-text-muted mt-1 text-sm flex items-center gap-2">
                        {unreadCount > 0 ? (
                            <>
                                <span className="inline-block w-2 h-2 rounded-full bg-danger animate-pulse" />
                                <span className="font-semibold text-text">{unreadCount} unread incidents</span>
                            </>
                        ) : (
                            <span className="text-sage font-medium">All alerts resolved &amp; clear</span>
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
                                        ? 'bg-primary text-white shadow-sm border border-primary'
                                        : 'bg-surface text-text-muted hover:text-text hover:bg-surface-lighter border border-border'
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
                            const colorClass = typeColors[alert.type] || 'text-text-muted bg-surface border-border';

                            return (
                                <div 
                                    key={alert._id}
                                    className={`glass-card p-5 flex items-start gap-4 transition-all animate-slide-up ${
                                        !alert.read 
                                            ? 'border-primary/40 bg-primary/5' 
                                            : 'opacity-85 hover:opacity-100'
                                    }`}
                                    style={{ animationDelay: `${0.1 + i * 0.03}s` }}
                                >
                                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${colorClass} ${!alert.read && alert.severity === 'critical' ? 'animate-pulse' : ''}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <h3 className="text-sm font-bold text-text tracking-tight">{alert.title}</h3>
                                            <div className="flex items-center gap-2 shrink-0 ml-4">
                                                <span className={`badge ${
                                                    alert.severity === 'critical' ? 'badge-danger' :
                                                        alert.severity === 'high' ? 'badge-warning' :
                                                            alert.severity === 'medium' ? 'badge-info' : 'badge-success'
                                                }`}>{alert.severity}</span>
                                                <span className="text-[11px] text-text-muted font-mono">
                                                    {new Date(alert.timestamp || alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-text-muted leading-relaxed">{alert.message}</p>
                                        {alert.productId && (
                                            <p className="text-[11px] text-copper font-medium mt-1 uppercase tracking-wider">
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
                                            className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-lighter transition-all shrink-0 cursor-pointer border border-transparent hover:border-border"
                                            title="Mark as read"
                                        >
                                            <HiOutlineCheck className="w-4 h-4 text-sage" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {filtered.length === 0 && (
                        <div className="glass-card p-12 text-center text-text-muted">
                            <HiOutlineBell className="w-12 h-12 mx-auto mb-3 text-text-muted/60" />
                            <h3 className="text-base font-bold text-text mb-1">No alerts matching filter</h3>
                            <p className="text-xs text-text-muted">All alerts in this category are resolved.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
