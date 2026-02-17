import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-[1400px] mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
