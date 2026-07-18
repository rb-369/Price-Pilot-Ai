import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import finalLogo from '../assets/FINAL.svg';

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
    const [form, setForm] = useState({ name: '', email: '', password: '', storeType: 'general', customStoreType: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
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
            toast.success('Account created!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center auth-bg p-4 relative overflow-x-hidden overflow-y-auto">
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

                <p className="text-center text-text-muted text-sm mt-6">
                    Already have an account? <Link to="/login" className="text-primary font-semibold hover:text-primary-light transition-colors">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
