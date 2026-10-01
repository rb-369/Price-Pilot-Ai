import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, googleAuth as apiGoogleAuth, getProfile, completeOnboarding as apiCompleteOnboarding } from '../api';
import PricePilotChartLoader from '../components/PricePilotChartLoader';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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

    const loginWithGoogle = async (googleData) => {
        const payload = typeof googleData === 'string' ? { access_token: googleData } : googleData;
        const res = await apiGoogleAuth(payload);
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

    const logout = async () => {
        setIsLoggingOut(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        localStorage.removeItem('token');
        localStorage.removeItem('pricepilot_active_profile');
        setUser(null);
        setIsLoggingOut(false);
    };

    const activeProfile = user?.profiles?.find(p => p.id === (user?.activeProfileId || 'default')) || user?.profiles?.[0] || {
        id: 'default',
        name: user?.storeName || 'Primary Store',
        storeType: user?.storeType || 'general',
        platform: 'Shopify',
        role: user?.role === 'admin' ? 'Administrator' : 'Store Owner',
        currency: 'INR',
        color: '#A85A3C',
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
            isLoggingOut,
            loading,
        }}>
            {children}
            {isLoggingOut && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-surface/95 backdrop-blur-md animate-fade-in p-4">
                    <div className="glass-card p-8 rounded-3xl border border-border shadow-2xl flex flex-col items-center">
                        <PricePilotChartLoader
                            size="large"
                            variant="card"
                            showDelay={0}
                            message="Signing out of PricePilot AI..."
                        />
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
