import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import Animated404 from '../components/Animated404';
import { LuCompass } from 'react-icons/lu';
import { HiOutlineArrowLeft } from 'react-icons/hi2';

export default function NotFound() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white dark:bg-[#070b14] text-slate-900 dark:text-white flex flex-col justify-between p-6 sm:p-8 transition-colors duration-200 selection:bg-slate-200 dark:selection:bg-slate-800">
            {/* Top Bar with Minimalist Brand & Theme Toggle */}
            <header className="w-full flex items-center justify-between max-w-5xl mx-auto">
                <Link to="/" className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white hover:opacity-80 transition-opacity">
                    PricePilot <span className="text-indigo-600 dark:text-indigo-400">AI</span>
                </Link>
                <ThemeToggle />
            </header>

            {/* Main Centered 404 Hero */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 my-auto">
                {/* Animated 3-Bar Graph -> 404 Pop Sequence */}
                <Animated404 />

                {/* Page not found */}
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-4 sm:mt-6 mb-3">
                    Page not found
                </h2>

                {/* Subtitle / Description */}
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    The page you are looking for does not exist or has been moved.<br className="hidden sm:inline" /> Check the URL, or head back to safety.
                </p>

                {/* Pill Buttons Container */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                    {/* Primary Button: Go Home */}
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition-all shadow-sm active:scale-95"
                    >
                        <LuCompass className="w-4 h-4" />
                        <span>Go Home</span>
                    </Link>

                    {/* Secondary Button: Go Back */}
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer"
                    >
                        <HiOutlineArrowLeft className="w-4 h-4" />
                        <span>Go Back</span>
                    </button>
                </div>

                {/* Subtle Helper Link to Dashboard */}
                <div className="mt-8">
                    <Link
                        to={user ? '/dashboard' : '/login'}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors inline-flex items-center gap-1 font-medium"
                    >
                        <span>Back to Dashboard</span>
                        <span>&rarr;</span>
                    </Link>
                </div>
            </main>

            {/* Bottom Footer Spacing */}
            <footer className="w-full text-center text-xs text-slate-400 dark:text-slate-600">
                &copy; {new Date().getFullYear()} PricePilot AI
            </footer>
        </div>
    );
}
