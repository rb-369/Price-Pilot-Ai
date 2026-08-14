import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import useRealTimeUpdates from '../hooks/useRealTimeUpdates';

export default function Layout() {
    const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
    const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
    const location = useLocation();
    const isChatPage = location.pathname === '/dashboard/chat';
    useRealTimeUpdates();

    // Listen to window resize to manage desktop vs mobile sidebar state
    useEffect(() => {
        const handleResize = () => {
            const desktop = window.innerWidth >= 1024;
            setIsDesktop(desktop);
            if (!desktop) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Automatically close sidebar drawer on mobile on route navigation
    useEffect(() => {
        if (!isDesktop) {
            setSidebarOpen(false);
        }
    }, [location.pathname, isDesktop]);

    return (
        <div className="flex h-screen overflow-hidden bg-surface">
            {/* Top accent gradient bar */}
            <div className="accent-bar fixed top-0 left-0 right-0 z-[100]" />

            {/* Sidebar (fixed desktop or off-canvas mobile drawer) */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isDesktop={isDesktop} />

            {/* Main content area: marginLeft only applies on desktop when sidebar is open */}
            <div
                className="flex min-h-0 flex-col flex-1 h-full w-full"
                style={{
                    marginLeft: (isDesktop && sidebarOpen) ? '260px' : '0',
                    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {/* Persistent Top Header */}
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isDesktop={isDesktop} />

                {/* Page Content Container */}
                <main className={isChatPage ? 'relative flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden' : 'min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8'}>
                    <div className={isChatPage ? 'h-full w-full' : 'mx-auto w-full max-w-[1440px] animate-fade-in'}>
                        <Outlet context={{ sidebarOpen, setSidebarOpen, isDesktop }} />
                    </div>
                </main>
            </div>
        </div>
    );
}
