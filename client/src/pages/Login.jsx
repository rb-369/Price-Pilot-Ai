import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineSparkles, HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-[#7c3aed] to-accent mb-5 shadow-xl shadow-primary/25 animate-pulse-glow">
                        <HiOutlineSparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-text tracking-tight">Welcome Back</h1>
                    <p className="text-text-muted mt-2 text-sm">Sign in to PricePilot AI Intelligence</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Email</label>
                        <div className="relative group">
                            <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/60 w-5 h-5 group-focus-within:text-primary transition-colors" />
                            <input type="email" className="input-field pl-11" placeholder="admin@ecom.ai"
                                value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Password</label>
                        <div className="relative group">
                            <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/60 w-5 h-5 group-focus-within:text-primary transition-colors" />
                            <input type="password" className="input-field pl-11" placeholder="••••••••"
                                value={password} onChange={(e) => setPassword(e.target.value)} required />
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
