import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    HiOutlineMenu, 
    HiOutlineChatAlt, 
    HiOutlineExclamationCircle, 
    HiOutlineUser,
    HiOutlineLogout,
    HiOutlineSearch
} from 'react-icons/hi';
import NotificationDropdown from './NotificationDropdown';
import ThemeToggle from './ThemeToggle';
import FeedbackModal from './FeedbackModal';
import ReportModal from './ReportModal';
import UserAvatar from './UserAvatar';
import MobileSearchModal from './MobileSearchModal';

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

export default function Header({ sidebarOpen, setSidebarOpen, isDesktop }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);

    // Global Cmd+K / Ctrl+K shortcut to open search modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchModalOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const currentTitle = routeTitles[location.pathname] || 'PricePilot AI';

    return (
        <>
            <header className="sticky top-0 z-40 flex flex-col border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0a0f1e]/90 backdrop-blur-md transition-colors duration-200 shadow-sm dark:shadow-none">
                {/* Top Header Row */}
                <div className="flex h-15 sm:h-16 items-center justify-between px-3 sm:px-6 lg:px-8">
                    {/* Left section: Hamburger + Page Title */}
                    <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                        {(!sidebarOpen || !isDesktop) && (
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-[#131b2e] dark:border-slate-800 text-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:border-slate-700 transition-all cursor-pointer shadow-sm flex-shrink-0"
                                aria-label="Open sidebar"
                            >
                                <HiOutlineMenu size={19} />
                            </button>
                        )}

                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[130px] xs:max-w-[160px] sm:max-w-[260px] md:max-w-none">
                                    {currentTitle}
                                </h1>
                                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 flex-shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                                    Live AI Sync
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Middle section: Desktop Search Pill Bar */}
                    <button
                        type="button"
                        onClick={() => setSearchModalOpen(true)}
                        className="hidden md:flex items-center justify-between w-64 lg:w-72 xl:w-80 px-3.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-medium hover:border-indigo-500/40 transition-all cursor-pointer shadow-inner"
                        title="Search anything (Cmd+K)"
                    >
                        <div className="flex items-center gap-2 truncate">
                            <HiOutlineSearch size={15} className="text-slate-400 shrink-0" />
                            <span className="truncate">Find any product, forecast...</span>
                        </div>
                        <kbd className="text-[10px] font-mono text-slate-500 bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                            ⌘K
                        </kbd>
                    </button>

                {/* Right section: Action Buttons, Notification Bell, Theme, Profile */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Quick Action: Feedback */}
                    <button
                        type="button"
                        onClick={() => setFeedbackOpen(true)}
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200 border border-slate-200 hover:border-indigo-300 dark:bg-[#131b2e] dark:border-slate-800 dark:hover:border-indigo-500/40 text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer shadow-sm"
                        title="Give Feedback"
                    >
                        <HiOutlineChatAlt className="text-indigo-600 dark:text-indigo-400" size={15} />
                        <span>Feedback</span>
                    </button>

                    {/* Quick Action: Report Bug */}
                    <button
                        type="button"
                        onClick={() => setReportOpen(true)}
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200 border border-slate-200 hover:border-red-300 dark:bg-[#131b2e] dark:border-slate-800 dark:hover:border-red-500/40 text-xs font-semibold text-slate-700 hover:text-red-600 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer shadow-sm"
                        title="Report Bug / Issue"
                    >
                        <HiOutlineExclamationCircle className="text-red-600 dark:text-red-400" size={15} />
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
                            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200 border border-slate-200 dark:bg-[#131b2e] dark:border-slate-800 dark:hover:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
                        >
                            <UserAvatar
                                avatar={user?.avatar}
                                name={user?.name}
                                className="w-6 h-6 rounded-lg text-xs flex-shrink-0"
                            />
                            <span className="hidden md:inline max-w-[100px] truncate text-slate-800 dark:text-slate-300 font-medium">
                                {user?.name?.split(' ')[0] || 'Merchant'}
                            </span>
                        </button>

                        {userMenuOpen && (
                            <div 
                                className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#0d1326] border border-slate-200 dark:border-slate-800 shadow-2xl py-1 z-50 text-slate-800 dark:text-slate-200 animate-scale-up"
                                onMouseLeave={() => setUserMenuOpen(false)}
                            >
                                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Merchant'}</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUserMenuOpen(false);
                                        navigate('/dashboard/settings');
                                    }}
                                    className="w-full px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer font-medium"
                                >
                                    <HiOutlineUser size={15} />
                                    Profile &amp; Settings
                                </button>
                                <div className="sm:hidden border-t border-slate-100 dark:border-slate-800/80 my-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            setFeedbackOpen(true);
                                        }}
                                        className="w-full px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer font-medium"
                                    >
                                        <HiOutlineChatAlt size={15} className="text-indigo-600 dark:text-indigo-400" />
                                        Submit Feedback
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            setReportOpen(true);
                                        }}
                                        className="w-full px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer font-medium"
                                    >
                                        <HiOutlineExclamationCircle size={15} className="text-red-600 dark:text-red-400" />
                                        Report Issue
                                    </button>
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUserMenuOpen(false);
                                        logout();
                                        navigate('/login');
                                    }}
                                    className="w-full px-3 py-2 text-xs text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 cursor-pointer font-medium"
                                >
                                    <HiOutlineLogout size={15} />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Search Pill Bar (Direct match to reference image top search bar) */}
                <div className="md:hidden px-3 pt-1.5 pb-2.5 bg-slate-50/95 dark:bg-[#0a0f1e]/95 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                        type="button"
                        onClick={() => setSearchModalOpen(true)}
                        className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-white dark:bg-[#121929] border border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-medium shadow-xs active:scale-[0.99] transition-transform cursor-pointer"
                    >
                        <span className="truncate">Find any product, forecast or alert...</span>
                        <HiOutlineSearch size={16} className="text-slate-400 shrink-0 ml-2" />
                    </button>
                </div>
            </header>

            {/* Modals */}
            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
            <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
            <MobileSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
        </>
    );
}
