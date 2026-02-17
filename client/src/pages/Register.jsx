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
        <div className="min-h-screen flex items-center justify-center bg-surface p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            </div>

            <div className="glass-card p-8 w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-primary mb-4">
                        <HiOutlineSparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-text">Create Account</h1>
                    <p className="text-text-muted mt-1">Join PricePilot AI Intelligence Platform</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-text-muted mb-1.5">Full Name</label>
                        <div className="relative">
                            <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                            <input type="text" className="input-field pl-10" placeholder="John Doe"
                                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-text-muted mb-1.5">Email</label>
                        <div className="relative">
                            <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                            <input type="email" className="input-field pl-10" placeholder="you@example.com"
                                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-text-muted mb-1.5">Password</label>
                        <div className="relative">
                            <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                            <input type="password" className="input-field pl-10" placeholder="Min 6 characters"
                                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-text-muted mb-1.5">Store Type</label>
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
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-text-muted text-sm mt-6">
                    Already have an account? <Link to="/login" className="text-primary hover:text-primary-light">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
