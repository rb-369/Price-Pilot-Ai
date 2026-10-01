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
    HiOutlineChatAlt
} from 'react-icons/hi';
import { useTheme } from '../context/ThemeContext';
import newLightLogo from '../assets/new_light_logo.png';
import newDarkLogo from '../assets/new_dark_logo.png';

export default function MobileBottomNav({ onOpenFeedback }) {
    const [moreOpen, setMoreOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const popoverRef = useRef(null);
    const { theme } = useTheme();

    const brandLogo = theme === 'dark' ? newDarkLogo : newLightLogo;

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
        <div className="md:hidden fixed bottom-3 left-3 right-3 z-50 flex items-center justify-between gap-2.5 max-w-md mx-auto pointer-events-none">
            {/* "More" Popover Menu */}
            {moreOpen && (
                <div
                    ref={popoverRef}
                    className="absolute bottom-[4.2rem] right-14 w-64 xs:w-72 bg-[#FBF8F1]/98 dark:bg-[#261B15]/98 backdrop-blur-2xl border border-[#D8D0C0] dark:border-[#594239] rounded-3xl shadow-[0_20px_50px_rgba(60,35,20,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-3 text-text animate-slide-up pointer-events-auto z-50 overflow-hidden"
                >
                    {/* Popover Header with Settings Gear */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#D8D0C0] dark:border-[#594239] px-1.5">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                                All Services
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setMoreOpen(false);
                                navigate('/dashboard/settings');
                            }}
                            className="p-1.5 rounded-full bg-[#EFE8DF] dark:bg-[#382821] hover:bg-primary/10 text-text-muted hover:text-primary transition-colors border border-[#D8D0C0] dark:border-[#594239] cursor-pointer"
                            title="Store Settings"
                        >
                            <HiOutlineCog size={16} />
                        </button>
                    </div>

                    {/* Popover Menu List */}
                    <div className="space-y-0.5 max-h-[58vh] overflow-y-auto custom-scrollbar pr-0.5">
                        <button
                            type="button"
                            onClick={() => {
                                setMoreOpen(false);
                                navigate('/dashboard/recommendations');
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                                location.pathname === '/dashboard/recommendations'
                                    ? 'bg-primary/15 text-primary'
                                    : 'hover:bg-primary/5 text-text-muted hover:text-text'
                            }`}
                        >
                            <HiOutlineLightBulb size={17} className="text-amber-500 shrink-0" />
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
                                    ? 'bg-primary/15 text-primary'
                                    : 'hover:bg-primary/5 text-text-muted hover:text-text'
                            }`}
                        >
                            <HiOutlineScale size={17} className="text-cyan-500 shrink-0" />
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
                                    ? 'bg-primary/15 text-primary'
                                    : 'hover:bg-primary/5 text-text-muted hover:text-text'
                            }`}
                        >
                            <HiOutlineTrendingUp size={17} className="text-copper shrink-0" />
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
                                    ? 'bg-primary/15 text-primary'
                                    : 'hover:bg-primary/5 text-text-muted hover:text-text'
                            }`}
                        >
                            <HiOutlineChartBar size={17} className="text-primary shrink-0" />
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
                                    ? 'bg-primary/15 text-primary'
                                    : 'hover:bg-primary/5 text-text-muted hover:text-text'
                            }`}
                        >
                            <HiOutlineBeaker size={17} className="text-purple-500 shrink-0" />
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
                                    ? 'bg-primary/15 text-primary'
                                    : 'hover:bg-primary/5 text-text-muted hover:text-text'
                            }`}
                        >
                            <HiOutlineLink size={17} className="text-sage shrink-0" />
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
                                    ? 'bg-primary/15 text-primary'
                                    : 'hover:bg-primary/5 text-text-muted hover:text-text'
                            }`}
                        >
                            <HiOutlineSwitchHorizontal size={17} className="text-copper shrink-0" />
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
                                    ? 'bg-primary/15 text-primary'
                                    : 'hover:bg-primary/5 text-text-muted hover:text-text'
                            }`}
                        >
                            <HiOutlineBell size={17} className="text-rose-500 shrink-0" />
                            <span>Alerts &amp; Incidents</span>
                        </button>

                        <div className="border-t border-[#D8D0C0] dark:border-[#594239] my-1 pt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setMoreOpen(false);
                                    navigate('/docs');
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium text-text-muted hover:text-text hover:bg-primary/5 transition-colors cursor-pointer"
                            >
                                <HiOutlineDocumentText size={17} className="text-text-muted shrink-0" />
                                <span>Platform Docs &amp; API</span>
                            </button>

                            {onOpenFeedback && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMoreOpen(false);
                                        onOpenFeedback();
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium text-text-muted hover:text-text hover:bg-primary/5 transition-colors cursor-pointer"
                                >
                                    <HiOutlineChatAlt size={17} className="text-primary shrink-0" />
                                    <span>Submit Feedback</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Navigation Pill Bar */}
            <nav
                className="pointer-events-auto flex-1 bg-[#FBF8F1]/95 dark:bg-[#261B15]/95 backdrop-blur-2xl border border-[#D8D0C0] dark:border-[#594239] rounded-full px-2 py-1.5 shadow-[0_12px_36px_rgba(60,35,20,0.12)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] flex items-center justify-around"
                aria-label="Mobile Navigation"
            >
                {/* 1. Overview / Home */}
                <NavLink
                    to="/dashboard"
                    end
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 cursor-pointer ${
                            isActive
                                ? 'bg-primary/15 text-primary font-bold shadow-xs'
                                : 'text-text-muted hover:text-text'
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
                                ? 'bg-primary/15 text-primary font-bold shadow-xs'
                                : 'text-text-muted hover:text-text'
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
                                ? 'bg-primary/15 text-primary font-bold shadow-xs'
                                : 'text-text-muted hover:text-text'
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
                            ? 'bg-primary/15 text-primary font-bold shadow-xs'
                            : 'text-text-muted hover:text-text'
                    }`}
                    aria-label="More navigation options"
                    aria-expanded={moreOpen}
                >
                    <HiOutlineDotsHorizontal size={19} />
                    <span className="text-[10px] font-semibold mt-0.5 tracking-tight">More</span>
                </button>
            </nav>

            {/* Circular AI Logo Floating Action Button with Real Website Brand Logo */}
            <button
                type="button"
                onClick={handleSparkClick}
                className="pointer-events-auto w-13 h-13 xs:w-14 xs:h-14 rounded-full bg-[#FBF8F1] dark:bg-[#2C1F18] border-2 border-[#D8D0C0] dark:border-[#594239] shadow-[0_8px_25px_rgba(168,90,60,0.25)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:border-primary flex items-center justify-center shrink-0 active:scale-90 transition-all duration-200 cursor-pointer group"
                title="Ask PricePilot AI Copilot"
                aria-label="Ask PricePilot AI Copilot"
            >
                <div className="relative flex items-center justify-center">
                    <img
                        src={brandLogo}
                        alt="PricePilot AI Logo"
                        className="w-8 h-8 object-contain group-hover:scale-110 transition-transform p-0.5"
                    />
                    {/* Subtle pulse indicator */}
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#2C1F18] animate-pulse" />
                </div>
            </button>
        </div>
    );
}
