import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../api';
import toast from 'react-hot-toast';
import finalLogo from '../assets/FINAL.svg';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, { password });
            toast.success('Password updated successfully!');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Token is invalid or has expired');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center auth-bg p-4 relative overflow-hidden">
            {/* Background floating animations */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <div className="glass-card p-8 sm:p-10 w-full max-w-md relative z-10 animate-slide-up">
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden mb-5 shadow-xl shadow-primary/25 animate-pulse-glow">
                        <img src={finalLogo} alt="PricePilot AI" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-text tracking-tight">Set New Password</h1>
                    <p className="text-text-muted mt-2 text-sm">Please establish your new password below</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Password input */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">New Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                className="input-field pr-12" 
                                placeholder="••••••••"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/60 hover:text-primary transition-colors text-xs font-medium"
                            >
                                {showPassword ? 'HIDE' : 'SHOW'}
                            </button>
                        </div>
                    </div>

                    {/* Confirm password input */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Confirm New Password</label>
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            className="input-field" 
                            placeholder="••••••••"
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Update Password'
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-4 border-t border-white/5 text-center">
                    <Link to="/login" className="text-sm text-primary-light font-semibold hover:text-primary transition-colors">
                        Return to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
