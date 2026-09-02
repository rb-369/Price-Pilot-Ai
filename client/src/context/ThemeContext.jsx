import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

const ThemeContext = createContext();

// Suppress CSS transitions during theme flip to prevent main-thread style thrashing (INP optimization)
function disableTransitionsTemporarily() {
    const css = document.createElement('style');
    css.appendChild(
        document.createTextNode(
            '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'
        )
    );
    document.head.appendChild(css);
    return () => {
        // Force reflow
        (() => window.getComputedStyle(document.body))();
        requestAnimationFrame(() => {
            if (css.parentNode) {
                document.head.removeChild(css);
            }
        });
    };
}

function applyThemeClass(theme) {
    const root = document.documentElement;
    if (theme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
    } else {
        root.classList.remove('light');
        root.classList.add('dark');
    }
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme') || 'dark';
        applyThemeClass(saved);
        return saved;
    });

    useEffect(() => {
        applyThemeClass(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            const next = prev === 'dark' ? 'light' : 'dark';
            const cleanup = disableTransitionsTemporarily();
            applyThemeClass(next);
            localStorage.setItem('theme', next);
            cleanup();
            return next;
        });
    }, []);

    const value = useMemo(() => ({
        theme,
        setTheme,
        toggleTheme
    }), [theme, toggleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
    return useContext(ThemeContext);
}
