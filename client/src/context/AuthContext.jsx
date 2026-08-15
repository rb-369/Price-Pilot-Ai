import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, googleAuth as apiGoogleAuth, getProfile, completeOnboarding as apiCompleteOnboarding } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            getProfile()
                .then((res) => setUser(res.data))
                .catch(() => localStorage.removeItem('token'))
                .finally(() => setLoading(false));
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await apiLogin({ email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data);
        return res.data;
    };

    const registerUser = async (data) => {
        const res = await apiRegister(data);
        localStorage.setItem('token', res.data.token);
        setUser(res.data);
        return res.data;
    };

    const loginWithGoogle = async (googleData) => {
        const res = await apiGoogleAuth(googleData);
        localStorage.setItem('token', res.data.token);
        setUser(res.data);
        return res.data;
    };

    const completeOnboarding = async (onboardingData) => {
        const res = await apiCompleteOnboarding(onboardingData);
        if (res.data?.token) {
            localStorage.setItem('token', res.data.token);
        }
        setUser(res.data);
        return res.data;
    };

    const updateUser = (updatedUser) => {
        setUser((prev) => ({ ...prev, ...updatedUser }));
    };

    const switchProfile = (profileId) => {
        setUser((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                activeProfileId: profileId,
            };
        });
        localStorage.setItem('pricepilot_active_profile', profileId);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('pricepilot_active_profile');
        setUser(null);
    };

    const activeProfile = user?.profiles?.find(p => p.id === (user?.activeProfileId || 'default')) || user?.profiles?.[0] || {
        id: 'default',
        name: user?.storeName || 'Primary Store',
        storeType: user?.storeType || 'general',
        platform: 'Shopify',
        role: user?.role === 'admin' ? 'Administrator' : 'Store Owner',
        currency: 'INR',
        color: '#6366f1',
    };

    return (
        <AuthContext.Provider value={{
            user,
            activeProfile,
            login,
            register: registerUser,
            loginWithGoogle,
            completeOnboarding,
            updateUser,
            switchProfile,
            logout,
            loading,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
