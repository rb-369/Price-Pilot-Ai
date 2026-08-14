import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import {
    HiOutlineChartBar, HiOutlineScale, HiOutlineCube,
    HiOutlineLightBulb, HiOutlineTrendingUp, HiOutlineBell,
    HiOutlineLogout, HiOutlineMoon, HiOutlineSun, HiOutlineChatAlt2,
    HiOutlineLink, HiOutlineBeaker, HiOutlineSwitchHorizontal,
    HiOutlineCog
} from 'react-icons/hi';
import { FiX } from 'react-icons/fi';
import newLightLogo from '../assets/new_light_logo.png';
import newDarkLogo from '../assets/new_dark_logo.png';

const links = [
    { to: '/dashboard', icon: HiOutlineChartBar, label: 'Dashboard' },
    { to: '/dashboard/analytics', icon: HiOutlineTrendingUp, label: 'Analytics' },
    { to: '/dashboard/products', icon: HiOutlineCube, label: 'Products' },
    { to: '/dashboard/competitors', icon: HiOutlineScale, label: 'Competitors' },
    { to: '/dashboard/demand', icon: HiOutlineTrendingUp, label: 'Demand Signals' },
    { to: '/dashboard/forecasts', icon: HiOutlineTrendingUp, label: 'Forecasts' },
    { to: '/dashboard/recommendations', icon: HiOutlineLightBulb, label: 'AI Recommendations' },
    { to: '/dashboard/ab-tests', icon: HiOutlineBeaker, label: 'A/B Test Experiments' },
    { to: '/dashboard/chat', icon: HiOutlineChatAlt2, label: 'PricePilot AI' },
    { to: '/dashboard/integrations', icon: HiOutlineLink, label: 'Integrations' },
    { to: '/dashboard/channel-mapping', icon: HiOutlineSwitchHorizontal, label: 'Channel Mapping' },
    { to: '/dashboard/alerts', icon: HiOutlineBell, label: 'Alerts' },
    { to: '/dashboard/settings', icon: HiOutlineCog, label: 'Profile & Settings' },
];

export default function Sidebar({ isOpen, onClose, isDesktop }) {
    const { user, activeProfile, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { currency, setCurrency, currencies } = useCurrency();
    const navigate = useNavigate();
    const brandLogo = theme === 'dark' ? newDarkLogo : newLightLogo;

    const handleLogout = () => {
        logout();
        navigate('/login');
        if (!isDesktop) onClose();
    };

    const handleNavClick = () => {
        if (!isDesktop) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="sidebar-wrapper fixed inset-0 lg:right-auto z-[9999] flex">
            {/* Click-away backdrop overlay (MOBILE ONLY) */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity cursor-pointer z-[9998]"
                aria-label="Close sidebar backdrop"
            />

            {/* Sidebar panel */}
            <aside 
                className="relative z-[9999] w-[270px] sm:w-[280px] lg:w-[260px] h-full flex flex-col shadow-2xl lg:shadow-none border-r border-indigo-500/10 transition-transform duration-300 ease-out"
                style={{
                    background: theme === 'light' ? 'linear-gradient(to bottom, #f8fafc, #f1f5f9)' : 'linear-gradient(to bottom, #0d1326, #0a0f1e)',
                }}
            >
                {/* Logo + Close button */}
                <div className="p-4 sm:p-5 border-b border-indigo-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 flex items-center justify-center rounded-xl overflow-hidden shadow-md shadow-primary/20 flex-shrink-0">
                            <img src={brandLogo} alt="PricePilot Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="font-bold text-text text-base sm:text-lg leading-tight tracking-tight">PricePilot</h1>
                            <p className="text-[11px] text-primary-light font-medium tracking-wide">AI Platform</p>
                        </div>
                    </div>

                    {/* Close button (always visible and prominent on mobile) */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 hover:bg-red-500/15 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400 border border-slate-300/80 dark:border-slate-700/60 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all cursor-pointer flex-shrink-0"
                        aria-label="Close sidebar"
                        title="Close sidebar"
                    >
                        <FiX size={17} />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto overscroll-contain">
                    <p className="text-[10px] text-text-muted/60 font-bold uppercase tracking-wider px-3 mb-2">Navigation</p>
                    {links.map(({ to, icon: Icon, label }) => (
                        <NavLink 
                            key={to} 
                            to={to} 
                            end={to === '/'}
                            onClick={handleNavClick}
                            className={({ isActive }) => 
                                `${isActive ? 'sidebar-link-active' : 'sidebar-link'} py-2.5 px-3 rounded-xl flex items-center gap-3 transition-colors text-[13px] font-medium`
                            }
                        >
                            <Icon className="w-[18px] h-[18px] transition-transform duration-200 flex-shrink-0" />
                            <span className="truncate">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User Section & Quick Controls */}
                <div className="p-3 sm:p-4 border-t border-indigo-500/10 space-y-2 bg-slate-50/50 dark:bg-[#0a0f1e]/60">
                    {/* Clickable Profile Card */}
                    <div
                        onClick={() => {
                            navigate('/dashboard/settings');
                            if (!isDesktop) onClose();
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer transition-all duration-200 group"
                        title="Open Profile & Settings"
                    >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-primary-light text-sm font-bold ring-2 ring-primary/10 group-hover:scale-105 transition-transform flex-shrink-0">
                            {user?.avatar || user?.name?.charAt(0)?.toUpperCase() || '⚡'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-text truncate font-bold group-hover:text-primary transition-colors">{user?.name || 'User'}</p>
                            <p className="text-[10px] text-text-muted truncate">
                                {activeProfile?.name || user?.storeName || 'Primary Store'}
                            </p>
                        </div>
                        <HiOutlineCog className="w-4 h-4 text-text-muted/60 group-hover:text-primary group-hover:rotate-90 transition-all flex-shrink-0" />
                    </div>

                    {/* Quick controls bar */}
                    <div className="flex items-center justify-between px-1 pt-1.5 border-t border-border/20">
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="bg-surface border border-border/80 text-[11px] font-semibold text-text rounded-lg px-2 py-1 focus:outline-none focus:border-primary cursor-pointer"
                            title="Select Currency"
                        >
                            {currencies.map(c => (
                                <option key={c} value={c} className="bg-surface text-text">{c}</option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-indigo-500/10 transition-colors cursor-pointer"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? <HiOutlineSun className="w-4 h-4 text-amber-400" /> : <HiOutlineMoon className="w-4 h-4 text-primary" />}
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="p-1.5 rounded-lg text-danger/80 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                            title="Sign Out"
                        >
                            <HiOutlineLogout className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Version Tag */}
                <div className="px-4 pb-3">
                    <div className="text-[10px] text-text-muted/40 text-center font-mono">PricePilot AI • v1.0</div>
                </div>
            </aside>
        </div>
    );
}
