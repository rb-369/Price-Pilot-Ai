import { memo } from 'react';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = memo(function ThemeToggle({ className = '' }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl text-[#3D1F12] hover:bg-[#3D1F12]/5 dark:text-[#F0EEE6] dark:hover:bg-white/5 border border-[#3D1F12]/15 dark:border-[#4A3930] transition-colors ${className}`}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? (
                <HiOutlineSun className="w-4 h-4 text-[#B8734F]" />
            ) : (
                <HiOutlineMoon className="w-4 h-4 text-[#3D1F12]" />
            )}
        </button>
    );
});

export default ThemeToggle;
