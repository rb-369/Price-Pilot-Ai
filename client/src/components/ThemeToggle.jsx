import { memo } from 'react';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = memo(function ThemeToggle({ className = '' }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors ${className}`}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? (
                <HiOutlineSun className="w-4 h-4 text-amber-400" />
            ) : (
                <HiOutlineMoon className="w-4 h-4 text-indigo-600" />
            )}
        </button>
    );
});

export default ThemeToggle;
