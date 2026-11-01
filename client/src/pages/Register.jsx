import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import newLightLogo from '../assets/new_light_logo.png';
import newDarkLogo from '../assets/new_dark_logo.png';
import { SiGoogle } from 'react-icons/si';
import { HiOutlinePhone } from 'react-icons/hi';
import { useGoogleLogin } from '@react-oauth/google';
import PricePilotChartLoader from '../components/PricePilotChartLoader';
import AuthHeroPanel from '../components/AuthHeroPanel';

const storeTypes = [
    { value: 'general', label: 'General Store' },
    { value: 'electronics', label: 'Electronics & Gadgets' },
    { value: 'fashion', label: 'Fashion & Apparel' },
    { value: 'groceries', label: 'Groceries & Supermarket' },
    { value: 'fitness', label: 'Fitness & Sports' },
    { value: 'beauty', label: 'Beauty & Personal Care' },
    { value: 'home', label: 'Home & Furniture' },
    { value: 'books', label: 'Books & Stationery' },
    { value: 'pharmacy', label: 'Pharmacy & Health' },
    { value: 'jewelry', label: 'Jewelry & Accessories' },
    { value: 'automotive', label: 'Automotive & Parts' },
    { value: 'toys', label: 'Toys & Kids' },
    { value: 'food', label: 'Food & Beverages' },
    { value: 'pet', label: 'Pet Supplies' },
    { value: 'digital', label: 'Digital Products' },
    { value: 'other', label: 'Other (Specify Below)' },
];

export default function Register() {
    const { theme } = useTheme();
    const finalLogo = theme === 'dark' ? newDarkLogo : newLightLogo;
    const [form, setForm] = useState({ name: '', email: '', password: '', storeType: 'general', customStoreType: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submitData = {
                ...form,
                storeType: form.storeType === 'other' ? form.customStoreType : form.storeType,
            };
            delete submitData.customStoreType;
            await register(submitData);
            setIsBuffering(true);
            setLoading(false);
            await new Promise((res) => setTimeout(res, 2000));
            toast.success('Account created! Welcome to PricePilot AI.');
            navigate('/onboarding');
        } catch (err) {
            setIsBuffering(false);
            setLoading(false);
            toast.error(err.response?.data?.message || 'Registration failed');
        }
    };

    const handleGoogleRegister = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            try {
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoResponse.json();

                const userData = await loginWithGoogle({
                    email: userInfo.email,
                    name: userInfo.name || userInfo.given_name || userInfo.email.split('@')[0],
                    googleId: userInfo.sub,
                    picture: userInfo.picture,
                });
                setIsBuffering(true);
                setLoading(false);
                await new Promise((res) => setTimeout(res, 2000));
                toast.success('Welcome to PricePilot AI!');
                if (userData?.onboarding?.completed) {
                    navigate('/dashboard');
                } else {
                    navigate('/onboarding');
                }
            } catch (err) {
                setIsBuffering(false);
                setLoading(false);
                toast.error(err.response?.data?.message || 'Google registration failed');
            }
        },
        onError: (err) => {
            console.error('Google register error:', err);
            toast.error('Google registration failed. Check your network or Google Client ID.');
        }
    });

    return (
        <div className="min-h-screen flex items-center justify-center w-full auth-bg relative overflow-x-hidden p-4 sm:p-6 lg:p-8">
            {/* 2-Second Post-Register Buffering Overlay */}
            {isBuffering && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/95 backdrop-blur-md animate-fade-in p-4">
                    <div className="glass-card p-8 rounded-3xl border border-border shadow-2xl flex flex-col items-center">
                        <PricePilotChartLoader
                            size="large"
                            variant="card"
                            showDelay={0}
                            message="Setting up your PricePilot AI workspace..."
                        />
                    </div>
                </div>
            )}

            {/* Back to Home Button - top-left */}
            <Link
                to="/"
                className="fixed top-6 left-6 lg:top-8 lg:left-8 z-30 inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text bg-surface-light/80 hover:bg-surface-lighter px-3.5 py-2 rounded-xl border border-border backdrop-blur-md transition-colors shadow-sm"
            >
                ← Back to Home
            </Link>

            {/* Floating orbs */}
            <div className="orb orb-1 pointer-events-none" />
            <div className="orb orb-2 pointer-events-none" />
            <div className="orb orb-3 pointer-events-none" />

            {/* Centered 2-column container with 5cm gap */}
            <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-[5cm] relative z-10 my-auto py-2 lg:py-4">
                {/* Left Brand/Hero Section */}
                <AuthHeroPanel />

                {/* Right Form Section - Compact height to fit in one screen */}
                <div className="w-full max-w-[420px] shrink-0 flex flex-col items-center justify-center relative">
                    <div className="glass-card p-6 sm:p-7 w-full relative z-10 animate-slide-up">
                        {/* Logo & Heading */}
                        <div className="text-center mb-5">
                            <Link to="/" className="inline-flex items-center justify-center w-11 h-11 p-2 rounded-xl overflow-hidden mb-2 shadow-lg shadow-primary/25 animate-pulse-glow transition-transform hover:scale-105" title="Return to Home">
                                <img src={finalLogo} alt="PricePilot AI" className="w-full h-full object-contain" />
                            </Link>
                            <h1 className="text-2xl font-extrabold text-text tracking-tight">Create Account</h1>
                            <p className="text-text-muted mt-1 text-xs">Join PricePilot AI Intelligence Platform</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            {/* Full Name */}
                            <div>
                                <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">Full Name</label>
                                <input type="text" className="input-field py-2 text-sm" placeholder="John Doe"
                                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">Email</label>
                                <input type="email" className="input-field py-2 text-sm" placeholder="you@example.com"
                                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">Password</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} className="input-field py-2 pr-12 text-sm" placeholder="Min 6 characters"
                                        value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} autoComplete="new-password" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/60 hover:text-primary transition-colors text-xs font-medium">
                                        {showPassword ? 'HIDE' : 'SHOW'}
                                    </button>
                                </div>
                            </div>

                            {/* Store Type */}
                            <div>
                                <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">Store Type</label>
                                <select className="input-field py-2 text-sm" value={form.storeType}
                                    onChange={(e) => setForm({ ...form, storeType: e.target.value })}>
                                    {storeTypes.map(({ value, label }) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Custom Store Type - shown when "Other" is selected */}
                            {form.storeType === 'other' && (
                                <div className="animate-slide-up">
                                    <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">Specify Your Store Type</label>
                                    <input type="text" className="input-field py-2 text-sm" placeholder="e.g. Organic Products, Handicrafts..."
                                        value={form.customStoreType} onChange={(e) => setForm({ ...form, customStoreType: e.target.value })} required />
                                </div>
                            )}

                            <button type="submit" disabled={loading || isBuffering}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50 mt-1">
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : isBuffering ? (
                                    'Preparing Workspace...'
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-3.5">
                            <div className="flex-1 h-px bg-primary/10" />
                            <span className="text-[11px] text-text-muted uppercase tracking-wider">or sign up with</span>
                            <div className="flex-1 h-px bg-primary/10" />
                        </div>

                        {/* Google + Phone Register Buttons */}
                        <div className="flex gap-2.5">
                            <button
                                type="button"
                                onClick={handleGoogleRegister}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-surface-light hover:bg-surface-lighter transition-all shadow-sm cursor-pointer"
                            >
                                <SiGoogle className="w-4 h-4" style={{ color: '#4285F4' }} />
                                <p className="text-xs font-semibold text-text">Google</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/login-phone')}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-surface-light hover:bg-surface-lighter transition-all shadow-sm cursor-pointer"
                            >
                                <HiOutlinePhone className="w-4 h-4 text-primary" />
                                <p className="text-xs font-semibold text-text">Phone</p>
                            </button>
                        </div>

                        <p className="text-center text-text-muted text-xs mt-3.5">
                            Already have an account? <Link to="/login" className="text-primary font-semibold hover:text-primary-light transition-colors">Sign In</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
