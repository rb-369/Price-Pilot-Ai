import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    HiOutlineHome,
    HiOutlineCube,
    HiOutlineTrendingUp,
    HiOutlineDotsHorizontal,
    HiOutlineCog,
    HiOutlineLightBulb,
    HiOutlineScale,
    HiOutlineChartBar,
    HiOutlineBeaker,
    HiOutlineLink,
    HiOutlineSwitchHorizontal,
    HiOutlineBell,
    HiOutlineDocumentText,
    HiOutlineChatAlt,
    HiOutlineSparkles
} from 'react-icons/hi';

export default function MobileBottomNav({ onOpenFeedback }) {
    const [moreOpen, setMoreOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const popoverRef = useRef(null);

    // Close "More" popover on route change
    useEffect(() => {
        setMoreOpen(false);
    }, [location.pathname]);

    // Close "More" popover on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setMoreOpen(false);
            }
        };
        if (moreOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [moreOpen]);

    const handleSparkClick = () => {
        setMoreOpen(false);
        // Trigger AI Assistant Chat Drawer
        window.dispatchEvent(new CustomEvent('open_chat_widget'));
    };

    const isCurrentActive = (path) => {
        if (path === '/dashboard') return location.pathname === '/dashboard';
        return location.pathname.startsWith(path);
    };

    const isMoreActive = [
        '/dashboard/recommendations',
        '/dashboard/competitors',
        '/dashboard/demand',
        '/dashboard/analytics',
        '/dashboard/ab-tests',
        '/dashboard/integrations',
        '/dashboard/channel-mapping',
        '/dashboard/alerts',
        '/dashboard/settings',
        '/docs'
    ].some(p => location.pathname.startsWith(p));

    return (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-50 flex items-center justify-between gap-2.5 max-w-md mx-auto pointer-events-none">
            {/* "More" Popover Menu (Direct match to reference image popover) */}
            {moreOpen && (
                <div
                    ref={popoverRef}
                    className="absolute bottom-[4.2rem] right-14 w-64 xs:w-72 bg-[#101728]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-3 text-slate-200 animate-slide-up pointer-events-auto z-50 overflow-hidden"
                >
                    {/* Popover Header with Settings Gear (matches user image) */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-1.5">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                                All Services
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setMoreOpen(false);
                                navigate('/dashboard/settings');
                            }}
                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                            title="Store Settings"
                        >
                            <HiOutlineCog size={16} />
                        </button>
                    </div>

                    {/* Popover Menu Grid / List */}
                    <div className="space-y-0.5 max-h-[58vh] overflow-y-auto custom-scrollbar pr-0.5">
                        <button
                            type="button"
                            onClick={() => {
                                setMoreOpen(false);
                                navigate('/dashboard/recommendations');
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                                location.pathname === '/dashboard/recommendations'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                            }`}
                        >
                            <HiOutlineLightBulb size={17} className="text-amber-400 shrink-0" />
                            <span>AI Recommendations</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMoreOpen(false);
                                navigate('/dashboard/competitors');
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                                location.pathname === '/dashboard/competitors'
                                    ? 'bg-cyan-500/20 text-cyan-300'
                                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                            }`}
                        >
                            <HiOutlineScale size={17} className="text-cyan-400 shrink-0" />
                            <span>Competitor Intel</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMoreOpen(false);
                                navigate('/dashboard/demand');
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                                location.pathname === '/dashboard/demand'
                                    ? 'bg-indigo-500/20 text-indigo-300'
                                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                            }`}
                        >
                            <HiOutlineTrendingUp size={17} className="text-indigo-400 shrink-0" />
                            <span>Demand Signals</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMoreOpen(false);
                                navigate('/dashboard/analytics');
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                                location.pathname === '/dashboard/analytics'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                            }`}
                        >
                            <HiOutlineChartBar size={17} className="text-blue-400 shrink-0" />
                            <span>Analytics &amp; Elasticity</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMoreOpen(false);
                                navigate('/dashboard/ab-tests');
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                                location.pathname === '/dashboard/ab-tests'
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                            }`}
                        >
                            <HiOutlineBeaker size={17} className="text-purple-400 shrink-0" />
                            <span>A/B Experiments</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMoreOpen(false);
                                navigate('/dashboard/integrations');
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                                location.pathname === '/dashboard/integrations'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                            }`}
                        >
                            <HiOutlineLink size={17} className="text-emerald-400 shrink-0" />
                            <span>Integrations</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMoreOpen(false);
                                navigate('/dashboard/channel-mapping');
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                                location.pathname === '/dashboard/channel-mapping'
                                    ? 'bg-teal-500/20 text-teal-300'
                                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                            }`}
                        >
                            <HiOutlineSwitchHorizontal size={17} className="text-teal-400 shrink-0" />
                            <span>Channel SKU Mapping</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMoreOpen(false);
                                navigate('/dashboard/alerts');
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                                location.pathname === '/dashboard/alerts'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                            }`}
                        >
                            <HiOutlineBell size={17} className="text-rose-400 shrink-0" />
                            <span>Alerts &amp; Incidents</span>
                        </button>

                        <div className="border-t border-white/10 my-1 pt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setMoreOpen(false);
                                    navigate('/docs');
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <HiOutlineDocumentText size={17} className="text-slate-400 shrink-0" />
                                <span>Platform Docs &amp; API</span>
                            </button>

                            {onOpenFeedback && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMoreOpen(false);
                                        onOpenFeedback();
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    <HiOutlineChatAlt size={17} className="text-indigo-400 shrink-0" />
                                    <span>Submit Feedback</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Navigation Pill Bar */}
            <nav
                className="pointer-events-auto flex-1 bg-[#101728]/95 dark:bg-[#0a0f1e]/95 backdrop-blur-2xl border border-white/15 dark:border-slate-800/80 rounded-full px-2 py-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.5)] flex items-center justify-around"
                aria-label="Mobile Navigation"
            >
                {/* 1. Overview / Home */}
                <NavLink
                    to="/dashboard"
                    end
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 cursor-pointer ${
                            isActive
                                ? 'bg-indigo-600/30 text-indigo-300 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                        }`
                    }
                >
                    <HiOutlineHome size={19} />
                    <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Overview</span>
                </NavLink>

                {/* 2. Products */}
                <NavLink
                    to="/dashboard/products"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 cursor-pointer ${
                            isActive
                                ? 'bg-indigo-600/30 text-indigo-300 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                        }`
                    }
                >
                    <HiOutlineCube size={19} />
                    <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Products</span>
                </NavLink>

                {/* 3. Forecasts */}
                <NavLink
                    to="/dashboard/forecasts"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 cursor-pointer ${
                            isActive
                                ? 'bg-indigo-600/30 text-indigo-300 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                        }`
                    }
                >
                    <HiOutlineTrendingUp size={19} />
                    <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Forecasts</span>
                </NavLink>

                {/* 4. More (Popup Launcher) */}
                <button
                    type="button"
                    onClick={() => setMoreOpen(!moreOpen)}
                    className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 cursor-pointer ${
                        moreOpen || (isMoreActive && !isCurrentActive('/dashboard') && !isCurrentActive('/dashboard/products') && !isCurrentActive('/dashboard/forecasts'))
                            ? 'bg-indigo-600/30 text-indigo-300 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                    }`}
                    aria-label="More navigation options"
                    aria-expanded={moreOpen}
                >
                    <HiOutlineDotsHorizontal size={19} />
                    <span className="text-[10px] font-semibold mt-0.5 tracking-tight">More</span>
                </button>
            </nav>

            {/* Circular AI Spark Floating Action Button (Matches User Screenshot FAB) */}
            <button
                type="button"
                onClick={handleSparkClick}
                className="pointer-events-auto w-13 h-13 xs:w-14 xs:h-14 rounded-full bg-gradient-to-tr from-white via-slate-100 to-slate-200 text-slate-900 shadow-[0_8px_30px_rgba(99,102,241,0.4)] hover:shadow-[0_10px_35px_rgba(168,85,247,0.6)] flex items-center justify-center shrink-0 border-2 border-white/60 active:scale-90 transition-all duration-200 cursor-pointer group"
                title="Ask PricePilot AI Copilot"
                aria-label="Ask PricePilot AI Copilot"
            >
                <div className="relative flex items-center justify-center">
                    {/* SVG 4-Point Star Sparkle icon styled exactly like the screenshot */}
                    <svg
                        className="w-6 h-6 text-slate-900 group-hover:scale-110 transition-transform fill-current"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
                    </svg>
                    {/* Subtle pulse indicator */}
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                </div>
            </button>
        </div>
    );
}
