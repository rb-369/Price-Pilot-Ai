import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlerts, markAlertRead, markAllAlertsRead } from '../api';
import toast from 'react-hot-toast';
import { 
    HiOutlineBell, 
    HiOutlineCheck, 
    HiOutlineExclamation, 
    HiOutlineTrendingDown, 
    HiOutlineShoppingCart,
    HiOutlineExternalLink,
    HiOutlineLightBulb,
    HiOutlineLightningBolt
} from 'react-icons/hi';

const typeIcons = {
    price_drop: HiOutlineTrendingDown,
    stockout_risk: HiOutlineExclamation,
    competitor_undercut: HiOutlineTrendingDown,
    competitor_stockout: HiOutlineShoppingCart,
    promotion: HiOutlineShoppingCart,
    reorder: HiOutlineShoppingCart,
    recommendation: HiOutlineLightBulb,
    demand: HiOutlineLightningBolt,
};

const severityStyles = {
    critical: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/15 dark:border-red-500/30',
    high: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/15 dark:border-amber-500/30',
    opportunity: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/15 dark:border-emerald-500/30',
    medium: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/15 dark:border-indigo-500/30',
    low: 'text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800/40 dark:border-slate-700/50',
};

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchAlerts = async () => {
        try {
            const res = await getAlerts();
            setAlerts(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            // silent fail
        }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const unreadCount = alerts.filter(a => !a.read).length;

    const handleMarkRead = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            await markAlertRead(id);
            setAlerts(prev => prev.map(a => a._id === id ? { ...a, read: true } : a));
        } catch (err) {
            // ignore
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAlertsRead();
            setAlerts(prev => prev.map(a => ({ ...a, read: true })));
            toast.success('All alerts marked as read');
        } catch (err) {
            toast.error('Failed to mark all as read');
        }
    };

    const handleAlertClick = async (alert) => {
        if (!alert.read) {
            await handleMarkRead(alert._id);
        }
        setIsOpen(false);
        if (alert.type === 'stockout_risk' || alert.type === 'reorder') {
            navigate('/dashboard/products');
        } else if (alert.type === 'competitor_undercut') {
            navigate('/dashboard/competitors');
        } else {
            navigate('/dashboard/alerts');
        }
    };

    const displayedAlerts = filter === 'unread' 
        ? alerts.filter(a => !a.read)
        : alerts.slice(0, 15);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell trigger button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
                    isOpen 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-600/20 dark:border-indigo-500/50 dark:text-indigo-300' 
                        : 'bg-slate-100/90 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-[#131b2e] dark:border-slate-800 dark:text-slate-300 dark:hover:text-white dark:hover:border-slate-700'
                }`}
                aria-label="Notifications"
                title="Notifications & Alerts"
            >
                <HiOutlineBell size={19} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-lg animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {isOpen && (
                <div 
                    className="fixed sm:absolute right-3 sm:right-0 mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-96 rounded-2xl bg-white dark:bg-[#0d1326] border border-slate-200 dark:border-indigo-500/20 shadow-2xl z-50 overflow-hidden text-slate-800 dark:text-slate-100 animate-scale-up"
                    style={{ transformOrigin: 'top right' }}
                >
                    {/* Header */}
                    <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#10172d] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllRead}
                                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
                            >
                                <HiOutlineCheck size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Filter tabs */}
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0d1326] flex items-center gap-2 text-xs">
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            className={`px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                                filter === 'all' 
                                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' 
                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            All ({alerts.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('unread')}
                            className={`px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                                filter === 'unread' 
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' 
                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>

                    {/* Alerts list */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                        {displayedAlerts.length === 0 ? (
                            <div className="py-8 text-center text-slate-500 text-xs">
                                {filter === 'unread' ? 'No unread notifications' : 'No recent alerts logged'}
                            </div>
                        ) : (
                            displayedAlerts.map((alert) => {
                                const Icon = typeIcons[alert.type] || HiOutlineBell;
                                const sevStyle = severityStyles[alert.severity] || severityStyles.medium;
                                return (
                                    <div
                                        key={alert._id}
                                        onClick={() => handleAlertClick(alert)}
                                        className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer flex gap-3 items-start ${
                                            !alert.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg border mt-0.5 flex-shrink-0 ${sevStyle}`}>
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                <p className={`text-xs font-semibold truncate ${!alert.read ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {alert.title || 'System Alert'}
                                                </p>
                                                {!alert.read && (
                                                    <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                {alert.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
                                                <span>{new Date(alert.timestamp || alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="capitalize">{alert.type?.replace(/_/g, ' ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#10172d] text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/dashboard/alerts');
                            }}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                            View All Alerts Center
                            <HiOutlineExternalLink size={13} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
