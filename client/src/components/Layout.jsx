import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { HiOutlineMenu, HiOutlineSparkles } from 'react-icons/hi';
import useRealTimeUpdates from '../hooks/useRealTimeUpdates';

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    useRealTimeUpdates();

    return (
        <div className="min-h-screen bg-surface">
            {/* Top accent gradient bar */}
            <div className="accent-bar fixed top-0 left-0 right-0 z-[100]" />

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content */}
            <div
                style={{
                    marginLeft: sidebarOpen ? '260px' : '0',
                    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: '100vh',
                }}
            >
                {/* Hamburger button when sidebar is closed */}
                {!sidebarOpen && (
                    <div style={{
                        position: 'sticky',
                        top: '4px',
                        zIndex: 30,
                        padding: '12px 16px 8px',
                    }}>
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                background: 'rgba(19,27,46,0.9)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(99,102,241,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#818cf8';
                                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#94a3b8';
                                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)';
                            }}
                            aria-label="Open sidebar"
                            title="Open sidebar"
                        >
                            <HiOutlineMenu size={20} />
                        </button>
                    </div>
                )}

                <div className="p-8 max-w-[1400px] mx-auto animate-fade-in">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
