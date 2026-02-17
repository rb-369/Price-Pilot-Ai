import { useState, useEffect } from 'react';
import { getAlerts, markAlertRead, markAllAlertsRead } from '../api';
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
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        getAlerts().then(r => setAlerts(r.data)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await markAlertRead(id);
            setAlerts(prev => prev.map(a => a._id === id ? { ...a, read: true } : a));
        } catch { }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAlertsRead();
            setAlerts(prev => prev.map(a => ({ ...a, read: true })));
            toast.success('All alerts marked as read');
        } catch { }
    };

    const filtered = filter === 'all' ? alerts :
        filter === 'unread' ? alerts.filter(a => !a.read) :
            alerts.filter(a => a.type === filter);

    if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-header text-3xl">Alerts & Notifications</h1>
                    <p className="text-text-muted mt-1">{alerts.filter(a => !a.read).length} unread alerts</p>
                </div>
                <button onClick={handleMarkAllRead} className="btn-secondary flex items-center gap-2">
                    <HiOutlineCheck className="w-4 h-4" /> Mark All Read
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'unread', 'competitor_undercut', 'stockout_risk', 'competitor_stockout', 'promotion'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-primary text-white' : 'bg-surface-lighter/50 text-text-muted hover:text-text'
                            }`}>
                        {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* Alert List */}
            <div className="space-y-3">
                {filtered.map(alert => {
                    const Icon = typeIcons[alert.type] || HiOutlineBell;
                    const colorClass = typeColors[alert.type] || 'text-text-muted bg-surface-lighter/50';

                    return (
                        <div key={alert._id}
                            className={`glass-card p-5 flex items-start gap-4 transition-all ${!alert.read ? 'border-l-4 border-l-primary' : 'opacity-70'}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                    <h3 className="text-sm font-semibold text-text">{alert.title}</h3>
                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                        <span className={
                                            alert.severity === 'critical' ? 'badge-danger' :
                                                alert.severity === 'high' ? 'badge-warning' :
                                                    alert.severity === 'medium' ? 'badge-info' : 'badge-success'
                                        }>{alert.severity}</span>
                                        <span className="text-xs text-text-muted">{new Date(alert.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-text-muted">{alert.message}</p>
                                {alert.productId && (
                                    <p className="text-xs text-text-muted mt-1">Product: {alert.productId.name || '—'}</p>
                                )}
                            </div>
                            {!alert.read && (
                                <button onClick={() => handleMarkRead(alert._id)}
                                    className="p-2 text-text-muted hover:text-primary transition-colors shrink-0"
                                    title="Mark as read">
                                    <HiOutlineCheck className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="glass-card p-12 text-center">
                    <HiOutlineBell className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-muted">No alerts to show</p>
                </div>
            )}
        </div>
    );
}
