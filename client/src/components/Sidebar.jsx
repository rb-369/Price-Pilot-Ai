import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineChartBar, HiOutlineScale, HiOutlineCube,
    HiOutlineLightBulb, HiOutlineTrendingUp, HiOutlineBell,
    HiOutlineLogout,
} from 'react-icons/hi';
import { FiX } from 'react-icons/fi';

const links = [
    { to: '/', icon: HiOutlineChartBar, label: 'Dashboard' },
    { to: '/products', icon: HiOutlineCube, label: 'Products' },
    { to: '/competitors', icon: HiOutlineScale, label: 'Competitors' },
    { to: '/demand', icon: HiOutlineTrendingUp, label: 'Demand Signals' },
    { to: '/forecasts', icon: HiOutlineTrendingUp, label: 'Forecasts' },
    { to: '/recommendations', icon: HiOutlineLightBulb, label: 'AI Recommendations' },
    { to: '/alerts', icon: HiOutlineBell, label: 'Alerts' },
];

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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
                background: 'linear-gradient(to bottom, #0d1326, #0a0f1e)',
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
                            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/20">
                                <img src="/FINAL.svg" alt="PricePilot" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className="font-bold text-text text-lg leading-tight tracking-tight">PricePilot</h1>
                                <p className="text-[10px] text-primary-light font-medium tracking-widest uppercase">AI Platform</p>
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
                    {links.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} end={to === '/'}
                            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}>
                            <Icon className="w-[18px] h-[18px] transition-transform duration-200" />
                            <span className="text-[13px] font-medium">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-[rgba(99,102,241,0.08)]">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-primary-light text-sm font-bold ring-2 ring-primary/10">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-text truncate font-medium">{user?.name || 'User'}</p>
                            <p className="text-[10px] text-text-muted truncate uppercase tracking-wider">{user?.role || 'user'}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout}
                        className="sidebar-link w-full text-danger/70 hover:bg-danger/8 hover:text-danger group">
                        <HiOutlineLogout className="w-[18px] h-[18px] group-hover:translate-x-[-2px] transition-transform" />
                        <span className="text-[13px] font-medium">Sign Out</span>
                    </button>
                </div>

                {/* Version */}
                <div className="px-6 pb-4">
                    <div className="text-[10px] text-text-muted/30 text-center">v2.0 • AI-Powered</div>
                </div>
            </aside>

            {/* Click-away backdrop overlay */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: '260px',
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 1,
                    cursor: 'pointer',
                }}
            />
        </div>
    );
}
