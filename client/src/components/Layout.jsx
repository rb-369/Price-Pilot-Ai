import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import useRealTimeUpdates from '../hooks/useRealTimeUpdates';

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const isChatPage = location.pathname === '/dashboard/chat';
    useRealTimeUpdates();

    return (
        <div className="flex h-screen overflow-hidden bg-surface">
            {/* Top accent gradient bar */}
            <div className="accent-bar fixed top-0 left-0 right-0 z-[100]" />

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content area */}
            <div
                className="flex min-h-0 flex-col flex-1 h-full w-full"
                style={{
                    marginLeft: sidebarOpen ? '260px' : '0',
                    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {/* Persistent Top Header */}
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                {/* Page Content Container */}
                <main className={isChatPage ? 'relative flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden' : 'min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8'}>
                    <div className={isChatPage ? 'h-full w-full' : 'mx-auto w-full max-w-[1440px] animate-fade-in'}>
                        <Outlet context={{ sidebarOpen, setSidebarOpen }} />
                    </div>
                </main>
            </div>
        </div>
    );
}
