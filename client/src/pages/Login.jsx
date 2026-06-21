import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import finalLogo from '../assets/FINAL.svg';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
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

    return (
        <div className="min-h-screen flex items-center justify-center auth-bg p-4 relative overflow-hidden">
            {/* Floating orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <div className="glass-card p-8 sm:p-10 w-full max-w-md relative z-10 animate-slide-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden mb-5 shadow-xl shadow-primary/25 animate-pulse-glow">
                        <img src={finalLogo} alt="PricePilot AI" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-text tracking-tight">Welcome Back</h1>
                    <p className="text-text-muted mt-2 text-sm">Sign in to PricePilot AI Intelligence</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Email</label>
                        <input type="email" className="input-field" placeholder="admin@ecom.ai"
                            value={email} onChange={(e) => setEmail(e.target.value)} required />
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
                                value={password} onChange={(e) => setPassword(e.target.value)} required />
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

                <p className="text-center text-text-muted text-sm mt-6">
                    Don't have an account? <Link to="/register" className="text-primary font-semibold hover:text-primary-light transition-colors">Sign Up</Link>
                </p>

                <div className="mt-5 p-3.5 bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.1)] rounded-xl text-xs text-text-muted text-center">
                    Demo: <span className="text-primary-light font-medium">admin@ecom.ai</span> / <span className="text-primary-light font-medium">admin123</span>
                </div>
            </div>
        </div>
    );
}
