import { useState, useEffect } from 'react';
import { getAlerts, markAlertRead, markAllAlertsRead, getProducts } from '../api';
import toast from 'react-hot-toast';
import { HiOutlineBell, HiOutlineCheck, HiOutlineExclamation, HiOutlineTrendingDown, HiOutlineShoppingCart } from 'react-icons/hi';

const typeIcons = {
    price_drop: HiOutlineTrendingDown,
    stockout_risk: HiOutlineExclamation,
    competitor_undercut: HiOutlineTrendingDown,
    competitor_stockout: HiOutlineShoppingCart,
    promotion: HiOutlineShoppingCart,
    reorder: HiOutlineShoppingCart,
};

const typeColors = {
    price_drop: 'text-accent bg-accent/10',
    stockout_risk: 'text-danger bg-danger/10',
    competitor_undercut: 'text-warning bg-warning/10',
    competitor_stockout: 'text-success bg-success/10',
    promotion: 'text-purple-400 bg-purple-400/10',
    reorder: 'text-blue-400 bg-blue-400/10',
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
            <div className="w-12 h-12 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    const unreadCount = alerts.filter(a => !a.read).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between animate-slide-up">
                <div>
                    <h1 className="page-header text-3xl">Alerts & Notifications</h1>
                    <p className="text-text-muted mt-1 text-sm">
                        {unreadCount > 0 ? (
                            <><span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse mr-1.5" />{unreadCount} unread alerts</>
                        ) : 'All caught up!'}
                    </p>
                </div>
                <button onClick={handleMarkAllRead} className="btn-secondary flex items-center gap-2">
                    <HiOutlineCheck className="w-4 h-4" /> Mark All Read
                </button>
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
                    <a href="/products" className="btn-primary">
                        Add Your First Product
                    </a>
                </div>
            ) : (
                <>
            {/* Filters */}
            <div className="flex gap-2 flex-wrap animate-slide-up" style={{ animationDelay: '0.05s' }}>
                {['all', 'unread', 'competitor_undercut', 'stockout_risk', 'competitor_stockout', 'promotion'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all uppercase tracking-wider ${filter === f
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-surface-lighter/40 text-text-muted hover:text-text hover:bg-primary/10 border border-primary/5'
                        }`}>
                        {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>

            {/* Alert List */}
            <div className="space-y-3">
                {filtered.map((alert, i) => {
                    const Icon = typeIcons[alert.type] || HiOutlineBell;
                    const colorClass = typeColors[alert.type] || 'text-text-muted bg-surface-lighter/50';

                    return (
                        <div key={alert._id}
                            className={`glass-card p-5 flex items-start gap-4 transition-all animate-slide-up ${!alert.read ? 'border-l-[3px] border-l-primary' : 'opacity-60'}`}
                            style={{ animationDelay: `${0.1 + i * 0.04}s` }}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass} ${!alert.read && alert.severity === 'critical' ? 'animate-pulse' : ''}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                    <h3 className="text-sm font-semibold text-text">{alert.title}</h3>
                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                        <span className={`badge ${
                                            alert.severity === 'critical' ? 'badge-danger' :
                                                alert.severity === 'high' ? 'badge-warning' :
                                                    alert.severity === 'medium' ? 'badge-info' : 'badge-success'
                                        }`}>{alert.severity}</span>
                                        <span className="text-[11px] text-text-muted">{new Date(alert.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-text-muted leading-relaxed">{alert.message}</p>
                                {alert.productId && (
                                    <p className="text-[11px] text-text-muted/70 mt-1 uppercase tracking-wider">Product: {alert.productId.name || '—'}</p>
                                )}
                            </div>
                            {!alert.read && (
                                <button onClick={() => handleMarkRead(alert._id)}
                                    className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all shrink-0"
                                    title="Mark as read">
                                    <HiOutlineCheck className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="glass-card empty-state">
                    <HiOutlineBell className="empty-state-icon w-16 h-16" />
                    <h3 className="text-lg font-semibold text-text mb-1">No alerts to show</h3>
                    <p className="text-text-muted text-sm">You're all caught up!</p>
                </div>
            )}
            </>
            )}
        </div>
    );
}
