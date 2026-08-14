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

export default function Sidebar({ isOpen, onClose }) {
    const { user, activeProfile, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { currency, setCurrency, currencies } = useCurrency();
    const navigate = useNavigate();
    const brandLogo = theme === 'dark' ? newDarkLogo : newLightLogo;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!isOpen) return null;

    return (
        <div className="sidebar-wrapper" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 9999, display: 'flex' }}>
            {/* Sidebar panel */}
            <aside style={{
                width: '260px',
                height: '100vh',
                background: theme === 'light' ? 'linear-gradient(to bottom, #f1f5f9, #f8fafc)' : 'linear-gradient(to bottom, #0d1326, #0a0f1e)',
                borderRight: '1px solid rgba(99,102,241,0.08)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                zIndex: 2,
            }}>
                {/* Logo + Close button */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl overflow-hidden shadow-md shadow-primary/20 flex-shrink-0">
                                <img src={brandLogo} alt="PricePilot Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className="font-bold text-text text-lg leading-tight tracking-tight">PricePilot</h1>
                                <p className="text-[11px] text-primary-light font-medium tracking-wide">AI Platform</p>
                            </div>
                        </div>
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'rgba(30,41,59,0.7)',
                                border: '1px solid rgba(99,102,241,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                flexShrink: 0,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                                e.currentTarget.style.color = '#f87171';
                                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(30,41,59,0.7)';
                                e.currentTarget.style.color = '#94a3b8';
                                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)';
                            }}
                            aria-label="Close sidebar"
                            title="Close sidebar"
                        >
                            <FiX size={16} />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 mt-2 overflow-y-auto">
                    <p className="text-[10px] text-text-muted/50 font-semibold uppercase tracking-widest px-3 mb-3">Navigation</p>
                    {links.map(({ to, icon: Icon, label }) => ( // eslint-disable-line no-unused-vars
                        <NavLink key={to} to={to} end={to === '/'}
                            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}>
                            <Icon className="w-[18px] h-[18px] transition-transform duration-200" />
                            <span className="text-[13px] font-medium">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-[rgba(99,102,241,0.08)] space-y-2">
                    {/* Clickable Profile Card */}
                    <div
                        onClick={() => navigate('/dashboard/settings')}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-lighter/60 cursor-pointer transition-all duration-200 group"
                        title="Open Profile & Settings"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-primary-light text-base font-bold ring-2 ring-primary/10 group-hover:scale-105 transition-transform">
                            {user?.avatar || user?.name?.charAt(0)?.toUpperCase() || '⚡'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className="text-xs text-text truncate font-bold group-hover:text-primary transition-colors">{user?.name || 'User'}</p>
                            </div>
                            <p className="text-[10px] text-text-muted truncate">
                                {activeProfile?.name || user?.storeName || 'Primary Store'}
                            </p>
                        </div>
                        <HiOutlineCog className="w-4 h-4 text-text-muted/60 group-hover:text-primary group-hover:rotate-90 transition-all" />
                    </div>

                    {/* Quick controls bar */}
                    <div className="flex items-center justify-between px-2 pt-1 border-t border-border/20">
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
                            onClick={toggleTheme}
                            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-[rgba(99,102,241,0.1)] transition-colors"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? <HiOutlineSun className="w-4 h-4 text-amber-400" /> : <HiOutlineMoon className="w-4 h-4 text-primary" />}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="p-1.5 rounded-lg text-danger/70 hover:text-danger hover:bg-danger/10 transition-colors"
                            title="Sign Out"
                        >
                            <HiOutlineLogout className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Version */}
                <div className="px-6 pb-4">
                    <div className="text-[10px] text-text-muted/30 text-center">v1.0 • AI-Powered</div>
                </div>
            </aside>

            {/* Click-away backdrop overlay (MOBILE ONLY) */}
            <div
                onClick={onClose}
                className="block lg:hidden"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9998,
                    cursor: 'pointer',
                }}
            />
        </div>
    );
}
