import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    HiOutlineExclamation, 
    HiOutlineLightningBolt, 
    HiOutlineLightBulb, 
    HiOutlineRefresh, 
    HiOutlineX, 
    HiOutlineArrowRight,
    HiOutlineBell
} from 'react-icons/hi';

const tierConfigs = {
    critical: {
        bg: 'bg-surface border-danger/40 text-text',
        badgeBg: 'bg-danger/15 text-danger border border-danger/30',
        glow: 'shadow-xl shadow-danger/15 ring-1 ring-danger/30',
        barColor: 'bg-danger',
        icon: HiOutlineExclamation,
        iconColor: 'text-danger',
        defaultLabel: 'Emergency Alert',
    },
    high: {
        bg: 'bg-surface border-brass/40 text-text',
        badgeBg: 'bg-brass/15 text-brass border border-brass/30',
        glow: 'shadow-xl shadow-brass/15 ring-1 ring-brass/30',
        barColor: 'bg-brass',
        icon: HiOutlineLightningBolt,
        iconColor: 'text-brass',
        defaultLabel: 'High Priority Alert',
    },
    recommendation: {
        bg: 'bg-surface border-sage/40 text-text',
        badgeBg: 'bg-sage/15 text-sage border border-sage/30',
        glow: 'shadow-xl shadow-sage/15 ring-1 ring-sage/30',
        barColor: 'bg-sage',
        icon: HiOutlineLightBulb,
        iconColor: 'text-sage',
        defaultLabel: 'AI Price Opportunity',
    },
    info: {
        bg: 'bg-surface border-border text-text',
        badgeBg: 'bg-primary/15 text-primary border border-primary/30',
        glow: 'shadow-xl shadow-primary/10 ring-1 ring-primary/25',
        barColor: 'bg-primary',
        icon: HiOutlineBell,
        iconColor: 'text-primary',
        defaultLabel: 'System Notification',
    }
};

export default function SlidableNotificationToast({ 
    t, 
    onDismiss, 
    type = 'info', 
    severity, 
    title, 
    message, 
    actionUrl, 
    actionLabel,
    duration = 6000 
}) {
    const navigate = useNavigate();
    const [dragX, setDragX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [exitDirection, setExitDirection] = useState(0);
    const [progress, setProgress] = useState(100);
    const [isPaused, setIsPaused] = useState(false);

    const startXRef = useRef(0);
    const currentXRef = useRef(0);
    const startTimeRef = useRef(Date.now());
    const remainingTimeRef = useRef(duration);
    const animFrameRef = useRef(null);

    // Determine config tier
    let tierKey = 'info';
    if (severity === 'critical' || type === 'critical') tierKey = 'critical';
    else if (severity === 'high' || type === 'demand' || type === 'warning') tierKey = 'high';
    else if (type === 'recommendation' || severity === 'opportunity') tierKey = 'recommendation';
    else if (severity === 'low' || type === 'alert') tierKey = 'info';

    const config = tierConfigs[tierKey] || tierConfigs.info;
    const IconComponent = config.icon;

    // Progress countdown timer
    useEffect(() => {
        if (isPaused || isExiting) return;

        const interval = setInterval(() => {
            remainingTimeRef.current -= 50;
            const pct = Math.max(0, (remainingTimeRef.current / duration) * 100);
            setProgress(pct);

            if (remainingTimeRef.current <= 0) {
                clearInterval(interval);
                handleAutoDismiss();
            }
        }, 50);

        return () => clearInterval(interval);
    }, [isPaused, isExiting, duration]);

    const handleAutoDismiss = () => {
        setIsExiting(true);
        setExitDirection(1);
        setTimeout(() => {
            onDismiss();
        }, 220);
    };

    // Pointer / Mouse Drag Events
    const handlePointerDown = (e) => {
        setIsDragging(true);
        startXRef.current = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        currentXRef.current = startXRef.current;
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        const delta = clientX - startXRef.current;
        currentXRef.current = clientX;
        setDragX(delta);
    };

    const handlePointerUp = () => {
        if (!isDragging) return;
        setIsDragging(false);

        // If dragged more than 60px in either direction, slide off screen
        if (Math.abs(dragX) > 60) {
            setIsExiting(true);
            setExitDirection(dragX > 0 ? 1 : -1);
            setTimeout(() => {
                onDismiss();
            }, 200);
        } else {
            // Snap back
            setDragX(0);
        }
    };

    const handleActionClick = (e) => {
        e.stopPropagation();
        onDismiss();
        if (actionUrl) {
            navigate(actionUrl);
        }
    };

    const opacity = isExiting ? 0 : Math.max(0.2, 1 - Math.abs(dragX) / 250);
    const transformX = isExiting 
        ? exitDirection * 400 
        : dragX;

    return (
        <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            style={{
                transform: `translateX(${transformX}px)`,
                opacity: opacity,
                transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
                touchAction: 'pan-y',
                userSelect: 'none',
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
            className={`relative w-full max-w-sm sm:max-w-md rounded-2xl border backdrop-blur-xl p-4 overflow-hidden select-none transition-all ${config.bg} ${config.glow}`}
            role="alert"
        >
            {/* Top Badge + Dismiss ✕ Header */}
            <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${config.badgeBg}`}>
                        <IconComponent className={`w-3.5 h-3.5 ${config.iconColor}`} />
                        <span>{title || config.defaultLabel}</span>
                    </span>
                    {severity && (
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
                            {severity}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
                        Swipe to dismiss
                    </span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAutoDismiss();
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        aria-label="Dismiss notification"
                        title="Dismiss"
                    >
                        <HiOutlineX size={16} />
                    </button>
                </div>
            </div>

            {/* Notification Body */}
            <div className="flex items-start gap-3 pl-0.5">
                <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-text leading-relaxed font-medium">
                        {message}
                    </p>

                    {/* Action Navigation */}
                    {actionUrl && (
                        <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-end">
                            <button
                                type="button"
                                onClick={handleActionClick}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer group"
                            >
                                <span>{actionLabel || 'View Details'}</span>
                                <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Countdown Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-border/40 overflow-hidden">
                <div 
                    className={`h-full ${config.barColor} transition-all duration-75`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
