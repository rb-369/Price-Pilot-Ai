import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineSparkles, HiOutlineUser, HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', storeType: 'general' });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(form);
            toast.success('Account created!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent via-[#7c3aed] to-primary mb-5 shadow-xl shadow-accent/25 animate-pulse-glow">
                        <HiOutlineSparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-text tracking-tight">Create Account</h1>
                    <p className="text-text-muted mt-2 text-sm">Join PricePilot AI Intelligence Platform</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Full Name</label>
                        <div className="relative group">
                            <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/60 w-5 h-5 group-focus-within:text-primary transition-colors" />
                            <input type="text" className="input-field pl-11" placeholder="John Doe"
                                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Email</label>
                        <div className="relative group">
                            <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/60 w-5 h-5 group-focus-within:text-primary transition-colors" />
                            <input type="email" className="input-field pl-11" placeholder="you@example.com"
                                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Password</label>
                        <div className="relative group">
                            <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/60 w-5 h-5 group-focus-within:text-primary transition-colors" />
                            <input type="password" className="input-field pl-11" placeholder="Min 6 characters"
                                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Store Type</label>
                        <select className="input-field" value={form.storeType}
                            onChange={(e) => setForm({ ...form, storeType: e.target.value })}>
                            <option value="general">General Store</option>
                            <option value="electronics">Electronics</option>
                            <option value="fashion">Fashion</option>
                            <option value="groceries">Groceries</option>
                            <option value="fitness">Fitness</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-50">
                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-text-muted text-sm mt-6">
                    Already have an account? <Link to="/login" className="text-primary font-semibold hover:text-primary-light transition-colors">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
