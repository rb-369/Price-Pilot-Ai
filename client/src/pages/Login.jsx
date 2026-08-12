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

export default function Login() {
    const { theme } = useTheme();
    const finalLogo = theme === 'dark' ? newDarkLogo : newLightLogo;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            try {
                // Fetch user info using the access token
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoResponse.json();
                
                // We'll send the email and name to our backend to login/register.
                // We can modify the backend to accept email/name directly. 
                // Or wait, since we wrote the backend to expect a credential to verify, 
                // we can also modify the backend to accept access_token. Let's just modify the backend.
                
                await loginWithGoogle(tokenResponse.access_token);
                toast.success('Welcome back!');
                navigate('/');
            } catch (err) {
                toast.error(err.response?.data?.message || 'Google login failed');
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            toast.error('Google login was unsuccessful');
        }
    });

    // TODO: Wire this up to your actual phone login flow/route
    const handlePhoneLogin = () => {
        navigate('/login-phone');
    };

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
                    <Link to="/" className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden mb-5 shadow-xl shadow-primary/25 animate-pulse-glow transition-transform hover:scale-105" title="Return to Home">
                        <img src={finalLogo} alt="PricePilot AI" className="w-full h-full object-cover" />
                    </Link>
                    <h1 className="text-3xl font-extrabold text-text tracking-tight">Welcome Back</h1>
                    <p className="text-text-muted mt-2 text-sm">Sign in to PricePilot AI Intelligence</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Email</label>
                        <input type="email" className="input-field" placeholder="you@example.com"
                            value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">Password</label>
                            <Link to="/forgot-password" className="text-xs text-primary hover:text-primary-light transition-colors font-medium">
                                Forgot Password?
                            </Link>
                        </div>
                        <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} className="input-field pr-12" placeholder="••••••••"
                                value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/60 hover:text-primary transition-colors text-xs font-medium">
                                {showPassword ? 'HIDE' : 'SHOW'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-50">
                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign In'}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-primary/10" />
                    <span className="text-xs text-text-muted uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-primary/10" />
                </div>

                {/* Google + Phone Login Buttons */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-primary/10 bg-surface/60 backdrop-blur-md hover:border-primary/30 hover:bg-surface/80 transition-all shadow-lg"
                    >
                        <SiGoogle className="w-5 h-5" style={{ color: '#4285F4' }} />
                        <p className="text-sm font-semibold text-text">Google</p>
                    </button>

                    <button
                        type="button"
                        onClick={handlePhoneLogin}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-primary/10 bg-surface/60 backdrop-blur-md hover:border-primary/30 hover:bg-surface/80 transition-all shadow-lg"
                    >
                        <HiOutlinePhone className="w-5 h-5 text-primary" />
                        <p className="text-sm font-semibold text-text">Phone</p>
                    </button>
                </div>

                <p className="text-center text-text-muted text-sm mt-6">
                    Don't have an account? <Link to="/register" className="text-primary font-semibold hover:text-primary-light transition-colors">Sign Up</Link>
                </p>
            </div>
        </div>
    );
}