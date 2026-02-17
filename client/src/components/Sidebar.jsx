import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineChartBar, HiOutlineScale, HiOutlineCube,
    HiOutlineLightBulb, HiOutlineTrendingUp, HiOutlineBell,
    HiOutlineLogout, HiOutlineSparkles,
} from 'react-icons/hi';

const links = [
    { to: '/', icon: HiOutlineChartBar, label: 'Dashboard' },
    { to: '/products', icon: HiOutlineCube, label: 'Products' },
    { to: '/competitors', icon: HiOutlineScale, label: 'Competitors' },
    { to: '/demand', icon: HiOutlineTrendingUp, label: 'Demand Signals' },
    { to: '/forecasts', icon: HiOutlineTrendingUp, label: 'Forecasts' },
    { to: '/recommendations', icon: HiOutlineLightBulb, label: 'AI Recommendations' },
    { to: '/alerts', icon: HiOutlineBell, label: 'Alerts' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="w-64 min-h-screen bg-surface-light/50 backdrop-blur-xl border-r border-border/50 flex flex-col">
            <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <HiOutlineSparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-text text-lg leading-tight">PricePilot AI</h1>
                        <p className="text-xs text-text-muted">Intelligence Platform</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {links.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} end={to === '/'}
                        className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}>
                        <Icon className="w-5 h-5" />
                        <span className="text-sm">{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-border/50">
                <div className="flex items-center gap-3 mb-3 px-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-text truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-text-muted truncate">{user?.role || 'user'}</p>
                    </div>
                </div>
                <button onClick={handleLogout}
                    className="sidebar-link w-full text-danger hover:bg-danger/10 hover:text-danger">
                    <HiOutlineLogout className="w-5 h-5" />
                    <span className="text-sm">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
