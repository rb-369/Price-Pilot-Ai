import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    HiOutlineMenu, 
    HiOutlineChatAlt, 
    HiOutlineExclamationCircle, 
    HiOutlineLightBulb, 
    HiOutlineUser,
    HiOutlineLogout
} from 'react-icons/hi';
import NotificationDropdown from './NotificationDropdown';
import ThemeToggle from './ThemeToggle';
import FeedbackModal from './FeedbackModal';
import ReportModal from './ReportModal';

const routeTitles = {
    '/dashboard': 'Dashboard Overview',
    '/dashboard/analytics': 'Analytics & Elasticity',
    '/dashboard/products': 'Product Catalog & Margins',
    '/dashboard/competitors': 'Competitor Intelligence',
    '/dashboard/demand': 'Demand Signals & Market Trends',
    '/dashboard/forecasts': 'Predictive Demand Forecasts',
    '/dashboard/recommendations': 'AI Pricing Recommendations',
    '/dashboard/ab-tests': 'A/B Price Experiments',
    '/dashboard/chat': 'PricePilot AI Copilot',
    '/dashboard/integrations': 'E-Commerce Integrations',
    '/dashboard/channel-mapping': 'Multi-Channel SKU Mapping',
    '/dashboard/alerts': 'Alerts & Incidents',
    '/dashboard/settings': 'Store Settings & Profile'
};

export default function Header({ sidebarOpen, setSidebarOpen }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const currentTitle = routeTitles[location.pathname] || 'PricePilot AI';

    return (
        <>
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#0a0f1e]/90 px-4 sm:px-8 backdrop-blur-md">
                {/* Left section: Hamburger + Page Title */}
                <div className="flex items-center gap-3 sm:gap-4">
                    {!sidebarOpen && (
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-xl bg-[#131b2e] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                            aria-label="Open sidebar"
                        >
                            <HiOutlineMenu size={20} />
                        </button>
                    )}

                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                {currentTitle}
                            </h1>
                            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Live AI Sync
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right section: Action Buttons, Notification Bell, Theme, Profile */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Quick Action: Feedback */}
                    <button
                        type="button"
                        onClick={() => setFeedbackOpen(true)}
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131b2e] border border-slate-800 hover:border-indigo-500/40 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                        title="Give Feedback"
                    >
                        <HiOutlineChatAlt className="text-indigo-400" size={15} />
                        <span>Feedback</span>
                    </button>

                    {/* Quick Action: Report Bug */}
                    <button
                        type="button"
                        onClick={() => setReportOpen(true)}
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131b2e] border border-slate-800 hover:border-red-500/40 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                        title="Report Bug / Issue"
                    >
                        <HiOutlineExclamationCircle className="text-red-400" size={15} />
                        <span>Report</span>
                    </button>

                    {/* Notification Bell Dropdown */}
                    <NotificationDropdown />

                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* User profile dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#131b2e] border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-all cursor-pointer"
                        >
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold text-xs">
                                {user?.name ? user.name[0].toUpperCase() : 'U'}
                            </div>
                            <span className="hidden md:inline max-w-[100px] truncate text-slate-300">
                                {user?.name?.split(' ')[0] || 'Merchant'}
                            </span>
                        </button>

                        {userMenuOpen && (
                            <div 
                                className="absolute right-0 mt-2 w-48 rounded-xl bg-[#0d1326] border border-slate-800 shadow-2xl py-1 z-50 text-slate-200 animate-scale-up"
                                onMouseLeave={() => setUserMenuOpen(false)}
                            >
                                <div className="px-3 py-2 border-b border-slate-800/80">
                                    <p className="text-xs font-bold text-white truncate">{user?.name || 'Merchant'}</p>
                                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUserMenuOpen(false);
                                        navigate('/dashboard/settings');
                                    }}
                                    className="w-full px-3 py-2 text-xs text-left text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer"
                                >
                                    <HiOutlineUser size={15} />
                                    Profile & Settings
                                </button>
                                <div className="sm:hidden border-t border-slate-800/80 my-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            setFeedbackOpen(true);
                                        }}
                                        className="w-full px-3 py-2 text-xs text-left text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer"
                                    >
                                        <HiOutlineChatAlt size={15} className="text-indigo-400" />
                                        Submit Feedback
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            setReportOpen(true);
                                        }}
                                        className="w-full px-3 py-2 text-xs text-left text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer"
                                    >
                                        <HiOutlineExclamationCircle size={15} className="text-red-400" />
                                        Report Issue
                                    </button>
                                </div>
                                <div className="border-t border-slate-800/80 my-1" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUserMenuOpen(false);
                                        logout();
                                        navigate('/login');
                                    }}
                                    className="w-full px-3 py-2 text-xs text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer"
                                >
                                    <HiOutlineLogout size={15} />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Modals */}
            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
            <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
        </>
    );
}
