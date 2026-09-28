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
    critical: 'text-danger bg-danger/10 border-danger/25',
    high: 'text-warning bg-warning/10 border-warning/25',
    opportunity: 'text-success bg-success/10 border-success/25',
    medium: 'text-primary bg-primary/10 border-primary/25',
    low: 'text-text-muted bg-surface border-border',
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
                        ? 'bg-primary/15 border-primary text-primary' 
                        : 'bg-[#FBF8F1] hover:bg-[#F7F3EB] border-[#D8D0C0] text-[#241812] dark:bg-[#30231D] dark:border-[#594239] dark:text-[#F3EDE3] dark:hover:border-primary/40'
                }`}
                aria-label="Notifications"
                title="Notifications & Alerts"
            >
                <HiOutlineBell size={19} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white shadow-md animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {isOpen && (
                <div 
                    className="fixed sm:absolute right-3 sm:right-0 mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-96 rounded-2xl bg-[#F7F3EB] dark:bg-[#30231D] border border-[#D8D0C0] dark:border-[#594239] shadow-2xl z-50 overflow-hidden text-text animate-slide-up"
                    style={{ transformOrigin: 'top right' }}
                >
                    {/* Header */}
                    <div className="px-4 py-3.5 border-b border-[#D8D0C0] dark:border-[#594239] bg-[#F0EEE6] dark:bg-[#261B15] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-text">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/25">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllRead}
                                className="text-xs text-primary hover:text-primary-dark flex items-center gap-1 font-medium cursor-pointer transition-colors"
                            >
                                <HiOutlineCheck size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Filter tabs */}
                    <div className="px-4 py-2 border-b border-[#D8D0C0] dark:border-[#594239] bg-[#F7F3EB] dark:bg-[#30231D] flex items-center gap-2 text-xs">
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            className={`px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                                filter === 'all' 
                                    ? 'bg-[#EFE8DF] dark:bg-[#382821] text-text font-bold shadow-sm' 
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            All ({alerts.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('unread')}
                            className={`px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                                filter === 'unread' 
                                    ? 'bg-primary/15 text-primary font-bold shadow-sm' 
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>

                    {/* Alerts list */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-[#D8D0C0]/60 dark:divide-[#594239]/60">
                        {displayedAlerts.length === 0 ? (
                            <div className="py-8 text-center text-text-muted text-xs">
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
                                        className={`px-4 py-3 hover:bg-[#FBF8F1] dark:hover:bg-[#382821] transition-colors cursor-pointer flex gap-3 items-start ${
                                            !alert.read ? 'bg-primary/[0.04]' : ''
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg border mt-0.5 flex-shrink-0 ${sevStyle}`}>
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                <p className={`text-xs truncate ${!alert.read ? 'text-text font-bold' : 'text-text-muted'}`}>
                                                    {alert.title || 'System Alert'}
                                                </p>
                                                {!alert.read && (
                                                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                                                {alert.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-1.5 text-[10px] text-text-muted">
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
                    <div className="p-2.5 border-t border-[#D8D0C0] dark:border-[#594239] bg-[#F0EEE6] dark:bg-[#261B15] text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/dashboard/alerts');
                            }}
                            className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
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
