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
            toast.success('Account created! Welcome to PricePilot AI.');
            navigate('/onboarding');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
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
                toast.success('Welcome to PricePilot AI!');
                if (userData?.onboarding?.completed) {
                    navigate('/dashboard');
                } else {
                    navigate('/onboarding');
                }
            } catch (err) {
                toast.error(err.response?.data?.message || 'Google registration failed');
            } finally {
                setLoading(false);
            }
        },
        onError: (err) => {
            console.error('Google register error:', err);
            toast.error('Google registration failed. Check your network or Google Client ID.');
        }
    });

    return (
        <div className="min-h-screen flex items-center justify-center auth-bg p-4 relative overflow-x-hidden overflow-y-auto">
            {/* Top Back to Home Button */}
            <Link to="/" className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text bg-surface-light/80 hover:bg-surface-lighter px-3.5 py-2 rounded-xl border border-border backdrop-blur-md transition-colors">
                ← Back to Home
            </Link>

            {/* Floating orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <div className="glass-card p-8 sm:p-10 w-full max-w-md relative z-10 animate-slide-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center justify-center w-14 h-14 p-2.5 rounded-2xl overflow-hidden mb-5 shadow-xl shadow-primary/25 animate-pulse-glow transition-transform hover:scale-105" title="Return to Home">
                        <img src={finalLogo} alt="PricePilot AI" className="w-full h-full object-contain" />
                    </Link>
                    <h1 className="text-3xl font-extrabold text-text tracking-tight">Create Account</h1>
                    <p className="text-text-muted mt-2 text-sm">Join PricePilot AI Intelligence Platform</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Full Name</label>
                        <input type="text" className="input-field" placeholder="John Doe"
                            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Email</label>
                        <input type="email" className="input-field" placeholder="you@example.com"
                            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Password</label>
                        <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} className="input-field pr-12" placeholder="Min 6 characters"
                                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} autoComplete="new-password" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/60 hover:text-primary transition-colors text-xs font-medium">
                                {showPassword ? 'HIDE' : 'SHOW'}
                            </button>
                        </div>
                    </div>

                    {/* Store Type */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Store Type</label>
                        <select className="input-field" value={form.storeType}
                            onChange={(e) => setForm({ ...form, storeType: e.target.value })}>
                            {storeTypes.map(({ value, label }) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Custom Store Type - shown when "Other" is selected */}
                    {form.storeType === 'other' && (
                        <div className="animate-slide-up">
                            <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Specify Your Store Type</label>
                            <input type="text" className="input-field" placeholder="e.g. Organic Products, Handicrafts..."
                                value={form.customStoreType} onChange={(e) => setForm({ ...form, customStoreType: e.target.value })} required />
                        </div>
                    )}

                    <button type="submit" disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-50">
                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-primary/10" />
                    <span className="text-xs text-text-muted uppercase tracking-wider">or sign up with</span>
                    <div className="flex-1 h-px bg-primary/10" />
                </div>

                {/* Google + Phone Register Buttons */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleGoogleRegister}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-primary/10 bg-surface/60 backdrop-blur-md hover:border-primary/30 hover:bg-surface/80 transition-all shadow-lg"
                    >
                        <SiGoogle className="w-5 h-5" style={{ color: '#4285F4' }} />
                        <p className="text-sm font-semibold text-text">Google</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/login-phone')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-primary/10 bg-surface/60 backdrop-blur-md hover:border-primary/30 hover:bg-surface/80 transition-all shadow-lg"
                    >
                        <HiOutlinePhone className="w-5 h-5 text-primary" />
                        <p className="text-sm font-semibold text-text">Phone</p>
                    </button>
                </div>

                <p className="text-center text-text-muted text-sm mt-6">
                    Already have an account? <Link to="/login" className="text-primary font-semibold hover:text-primary-light transition-colors">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
