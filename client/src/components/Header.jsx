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
            <header className="sticky top-0 z-40 flex flex-col border-b border-[#D8D0C0] dark:border-[#594239] bg-[#F0EEE6]/90 dark:bg-[#211610]/90 backdrop-blur-md transition-colors duration-200 shadow-sm dark:shadow-none">
                {/* Top Header Row */}
                <div className="flex h-15 sm:h-16 items-center justify-between px-3 sm:px-6 lg:px-8">
                    {/* Left section: Hamburger + Page Title */}
                    <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                        {(!sidebarOpen || !isDesktop) && (
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 rounded-xl bg-[#FBF8F1] hover:bg-[#F7F3EB] border border-[#D8D0C0] dark:bg-[#30231D] dark:border-[#594239] text-[#241812] dark:text-[#F3EDE3] transition-all cursor-pointer shadow-sm flex-shrink-0"
                                aria-label="Open sidebar"
                            >
                                <HiOutlineMenu size={19} />
                            </button>
                        )}

                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm sm:text-base lg:text-lg font-bold text-[#241812] dark:text-[#F3EDE3] tracking-tight truncate max-w-[130px] xs:max-w-[160px] sm:max-w-[260px] md:max-w-none">
                                    {currentTitle}
                                </h1>
                                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#5F806B]/15 text-[#5F806B] border border-[#5F806B]/30 flex-shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#5F806B] animate-pulse" />
                                    Live AI Sync
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Middle section: Desktop Search Pill Bar */}
                    <button
                        type="button"
                        onClick={() => setSearchModalOpen(true)}
                        className="hidden md:flex items-center justify-between w-64 lg:w-72 xl:w-80 px-3.5 py-1.5 rounded-xl bg-[#FBF8F1] dark:bg-[#30231D] border border-[#D8D0C0] dark:border-[#594239] text-[#5E5149] dark:text-[#C0B3A9] text-xs font-medium hover:border-primary/40 transition-all cursor-pointer shadow-inner"
                        title="Search anything (Cmd+K)"
                    >
                        <div className="flex items-center gap-2 truncate">
                            <HiOutlineSearch size={15} className="text-[#5E5149] dark:text-[#C0B3A9] shrink-0" />
                            <span className="truncate">Find any product, forecast...</span>
                        </div>
                        <kbd className="text-[10px] font-mono text-[#5E5149] dark:text-[#C0B3A9] bg-[#EDE8DD] dark:bg-[#211610] px-1.5 py-0.5 rounded border border-[#D8D0C0] dark:border-[#594239]">
                            ⌘K
                        </kbd>
                    </button>

                {/* Right section: Action Buttons, Notification Bell, Theme, Profile */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Quick Action: Feedback */}
                    <button
                        type="button"
                        onClick={() => setFeedbackOpen(true)}
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FBF8F1] hover:bg-[#F7F3EB] border border-[#D8D0C0] hover:border-primary/40 dark:bg-[#30231D] dark:border-[#594239] dark:hover:border-primary/40 text-xs font-semibold text-[#5E5149] hover:text-primary dark:text-[#C0B3A9] dark:hover:text-[#F3EDE3] transition-all cursor-pointer shadow-sm"
                        title="Give Feedback"
                    >
                        <HiOutlineChatAlt className="text-primary" size={15} />
                        <span>Feedback</span>
                    </button>

                    {/* Quick Action: Report Bug */}
                    <button
                        type="button"
                        onClick={() => setReportOpen(true)}
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FBF8F1] hover:bg-[#F7F3EB] border border-[#D8D0C0] hover:border-danger/40 dark:bg-[#30231D] dark:border-[#594239] dark:hover:border-danger/40 text-xs font-semibold text-[#5E5149] hover:text-danger dark:text-[#C0B3A9] dark:hover:text-[#F3EDE3] transition-all cursor-pointer shadow-sm"
                        title="Report Bug / Issue"
                    >
                        <HiOutlineExclamationCircle className="text-danger" size={15} />
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
                            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#FBF8F1] hover:bg-[#F7F3EB] border border-[#D8D0C0] dark:bg-[#30231D] dark:border-[#594239] text-xs font-semibold text-[#241812] dark:text-[#F3EDE3] transition-all cursor-pointer shadow-sm"
                        >
                            <UserAvatar
                                avatar={user?.avatar}
                                name={user?.name}
                                className="w-6 h-6 rounded-lg text-xs flex-shrink-0 ring-1 ring-primary/20"
                            />
                            <span className="hidden md:inline max-w-[100px] truncate text-text font-medium">
                                {user?.name?.split(' ')[0] || 'Merchant'}
                            </span>
                        </button>

                        {userMenuOpen && (
                            <div 
                                className="absolute right-0 mt-2 w-48 rounded-xl bg-[#F7F3EB] dark:bg-[#30231D] border border-[#D8D0C0] dark:border-[#594239] shadow-2xl py-1 z-50 text-text animate-slide-up"
                                onMouseLeave={() => setUserMenuOpen(false)}
                            >
                                <div className="px-3 py-2 border-b border-[#D8D0C0] dark:border-[#594239]">
                                    <p className="text-xs font-bold text-text truncate">{user?.name || 'Merchant'}</p>
                                    <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUserMenuOpen(false);
                                        navigate('/dashboard/settings');
                                    }}
                                    className="w-full px-3 py-2 text-xs text-left text-text hover:text-primary hover:bg-[#FBF8F1] dark:hover:bg-[#382821] flex items-center gap-2 cursor-pointer font-medium transition-colors"
                                >
                                    <HiOutlineUser size={15} />
                                    Profile &amp; Settings
                                </button>
                                <div className="sm:hidden border-t border-[#D8D0C0] dark:border-[#594239] my-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            setFeedbackOpen(true);
                                        }}
                                        className="w-full px-3 py-2 text-xs text-left text-text hover:text-primary hover:bg-[#FBF8F1] dark:hover:bg-[#382821] flex items-center gap-2 cursor-pointer font-medium transition-colors"
                                    >
                                        <HiOutlineChatAlt size={15} className="text-primary" />
                                        Submit Feedback
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            setReportOpen(true);
                                        }}
                                        className="w-full px-3 py-2 text-xs text-left text-text hover:text-danger hover:bg-[#FBF8F1] dark:hover:bg-[#382821] flex items-center gap-2 cursor-pointer font-medium transition-colors"
                                    >
                                        <HiOutlineExclamationCircle size={15} className="text-danger" />
                                        Report Issue
                                    </button>
                                </div>
                                <div className="border-t border-[#D8D0C0] dark:border-[#594239] my-1" />
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setUserMenuOpen(false);
                                        await logout();
                                        navigate('/login');
                                    }}
                                    className="w-full px-3 py-2 text-xs text-left text-danger hover:bg-danger/10 flex items-center gap-2 cursor-pointer font-medium transition-colors"
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
                <div className="md:hidden px-3 pt-1.5 pb-2.5 bg-[#F0EEE6]/95 dark:bg-[#211610]/95 border-t border-[#D8D0C0] dark:border-[#594239]">
                    <button
                        type="button"
                        onClick={() => setSearchModalOpen(true)}
                        className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-[#FBF8F1] dark:bg-[#30231D] border border-[#D8D0C0] dark:border-[#594239] text-[#5E5149] dark:text-[#C0B3A9] text-xs font-medium shadow-xs active:scale-[0.99] transition-transform cursor-pointer"
                    >
                        <span className="truncate">Find any product, forecast or alert...</span>
                        <HiOutlineSearch size={16} className="text-[#5E5149] dark:text-[#C0B3A9] shrink-0 ml-2" />
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
