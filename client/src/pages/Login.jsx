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
        <div className="min-h-screen flex items-center justify-center bg-surface p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="glass-card p-8 w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4">
                        <HiOutlineSparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-text">Welcome Back</h1>
                    <p className="text-text-muted mt-1">Sign in to PricePilot AI Intelligence</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm text-text-muted mb-1.5">Email</label>
                        <div className="relative">
                            <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                            <input type="email" className="input-field pl-10" placeholder="admin@ecom.ai"
                                value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-text-muted mb-1.5">Password</label>
                        <div className="relative">
                            <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                            <input type="password" className="input-field pl-10" placeholder="••••••••"
                                value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                    </div>
                    <button type="submit" disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-text-muted text-sm mt-6">
                    Don't have an account? <Link to="/register" className="text-primary hover:text-primary-light">Sign Up</Link>
                </p>

                <div className="mt-4 p-3 bg-surface/50 rounded-xl text-xs text-text-muted text-center">
                    Demo: <span className="text-text">admin@ecom.ai</span> / <span className="text-text">admin123</span>
                </div>
            </div>
        </div>
    );
}
