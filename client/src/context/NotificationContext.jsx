import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { updateProfile } from '../api';

const NotificationContext = createContext(null);

const STORAGE_KEY = 'pricepilot_mute_notifications';

export function NotificationProvider({ children }) {
    const { user, updateUser } = useAuth();
    
    // Initialize from localStorage or user preferences
    const [isMuted, setIsMuted] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
            return stored === 'true';
        }
        return Boolean(user?.preferences?.muteNotifications);
    });

    const isMutedRef = useRef(isMuted);
    isMutedRef.current = isMuted;

    // Sync with backend user preferences when user loads
    useEffect(() => {
        if (user?.preferences?.muteNotifications !== undefined) {
            const backendVal = Boolean(user.preferences.muteNotifications);
            const stored = localStorage.getItem(STORAGE_KEY);
            // If localStorage hasn't been set yet, adopt backend value
            if (stored === null) {
                setIsMuted(backendVal);
                localStorage.setItem(STORAGE_KEY, String(backendVal));
            } else if (stored !== String(backendVal)) {
                // If local and backend diverge, keep local preference and sync to backend
                const localVal = stored === 'true';
                setIsMuted(localVal);
            }
        }
    }, [user?.preferences?.muteNotifications]);

    // Listen to cross-tab storage changes or custom events
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === STORAGE_KEY && e.newValue !== null) {
                setIsMuted(e.newValue === 'true');
            }
        };

        const handleCustomEvent = (e) => {
            if (typeof e.detail === 'boolean') {
                setIsMuted(e.detail);
            }
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('pricepilot_mute_notifications_changed', handleCustomEvent);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('pricepilot_mute_notifications_changed', handleCustomEvent);
        };
    }, []);

    const toggleMute = useCallback(async (overrideVal) => {
        const nextVal = typeof overrideVal === 'boolean' ? overrideVal : !isMutedRef.current;
        
        setIsMuted(nextVal);
        isMutedRef.current = nextVal;
        localStorage.setItem(STORAGE_KEY, String(nextVal));

        // Dismiss active notification toasts immediately when muting
        if (nextVal) {
            toast.dismiss();
            toast('🔕 On-screen popups muted (Do Not Disturb)', {
                id: 'dnd-status-feedback',
                duration: 2500,
                style: {
                    background: 'var(--pp-surface)',
                    color: 'var(--pp-text)',
                    border: '1px solid var(--pp-border)',
                    fontWeight: 600
                }
            });
        } else {
            toast.success('🔔 On-screen popups active', {
                id: 'dnd-status-feedback',
                duration: 2500,
                style: {
                    background: 'var(--pp-surface)',
                    color: 'var(--pp-text)',
                    border: '1px solid var(--pp-border)',
                    fontWeight: 600
                }
            });
        }

        // Notify other listeners
        window.dispatchEvent(new CustomEvent('pricepilot_mute_notifications_changed', { detail: nextVal }));

        // Persist to backend if logged in
        if (user && updateUser) {
            try {
                const currentPrefs = user.preferences || {};
                const updatedPrefs = { ...currentPrefs, muteNotifications: nextVal };
                updateUser({ preferences: updatedPrefs });
                await updateProfile({ preferences: updatedPrefs });
            } catch (err) {
                console.warn('[NotificationContext] Failed to persist mute preference to backend:', err.message);
            }
        }
    }, [user, updateUser]);

    return (
        <NotificationContext.Provider value={{
            isMuted,
            toggleMute,
            setMute: (val) => toggleMute(Boolean(val))
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        // Fallback safe defaults if used outside provider
        const isMutedFallback = localStorage.getItem(STORAGE_KEY) === 'true';
        return {
            isMuted: isMutedFallback,
            toggleMute: () => {
                const next = !isMutedFallback;
                localStorage.setItem(STORAGE_KEY, String(next));
                window.dispatchEvent(new CustomEvent('pricepilot_mute_notifications_changed', { detail: next }));
            },
            setMute: (val) => {
                localStorage.setItem(STORAGE_KEY, String(val));
                window.dispatchEvent(new CustomEvent('pricepilot_mute_notifications_changed', { detail: val }));
            }
        };
    }
    return context;
}

